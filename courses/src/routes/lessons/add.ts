import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import 'express-async-errors'

import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { CourseKeys, LessonKeys, LessonStatus } from '@rkh-ms/classify-lib/enums'
import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'

import { Course } from '../../models/Course'
import { Lesson } from '../../models/Lesson'
import { sequelize } from '../../connect'
import { CourseUpdatedPublisher } from '../../rabbit_mq/publishers/CourseUpdatedPublisher'
import { LessonCreatedPublisher } from '../../rabbit_mq/publishers/LessonCreatedPublisher'
import { validateAddUpdateLesson } from '../../util/validate_add_update_lesson'
import { AddLessonRequestBody } from '../../types/lessonRequestType'

import dayjs from 'dayjs'
import customParseFormat from "dayjs/plugin/customParseFormat"
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { checkForCollision } from '../../util/checkForCollision'
import { API } from '@rkh-ms/classify-lib/api'
dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

const router = express.Router()


router.post(API.lessons.main,
    accessControlMiddleware(Actions.createAny, Resources.Lesson),
    validateAddUpdateLesson(),
    [
        body(LessonKeys.COURSE_ID)
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const {
            date,
            startTime,
            endTime,
            course_id
        } = req.body as AddLessonRequestBody

        // 1.check if course exists
        const course = await Course.findByPk(course_id)
        if (!course)
            throw new NotFoundError(req.t('errors', 'COURSE_NOT_FOUND'))

        // 2. check if lesson start date is before the course start date
        // if yes then throw an error
        const courseStartDate = dayjs(course.dataValues.startDate).startOf('day')
        const lessonDate = dayjs(date).startOf('day')

        if (lessonDate.isBefore(courseStartDate))
            throw new BadRequestError(req.t('errors', 'LESSON_DATE_BEFORE_COURSE_START_DATE'))

        // 3. check if the new lesson times collide with existing lessons
        const lessonStartTime = dayjs.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Jerusalem')
        const lessonEndTime = dayjs.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Jerusalem')

        await checkForCollision(course.dataValues.id, lessonStartTime.toDate(), lessonEndTime.toDate(),
            req)

        const transaction = await sequelize.transaction()
        try {

            // 4. add the lesson and set the status of the lesson
            const newLesson = await Lesson.create({
                course_id,
                startTime: lessonStartTime.toDate(),
                endTime: lessonEndTime.toDate(),
                status: dayjs().isAfter(lessonEndTime) ? LessonStatus.COMPLETED :
                    dayjs().isBefore(lessonStartTime) ? LessonStatus.SCHEDULED : LessonStatus.ONGOING
            }, { transaction })

            // 4.1 check if end date of the course must be updated
            if (dayjs(date).diff(dayjs(course.dataValues.endDate), 'day') >= 1) {
                console.log('need to change course end date');

                course.set({
                    [CourseKeys.END_DATE]: date
                })
            }

            // 4.2 increase by 1 number of lessons for the course
            course.set({
                [CourseKeys.NUMBER_OF_LESSONS]: course.dataValues.numberOfLessons + 1,
            })
            await course.save({ transaction })

            // 4.1 publish event indicate lesson created
            // and course updated
            new CourseUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(course.dataValues)
            new LessonCreatedPublisher(rabbitMQ_Wrapper.channel).publish(newLesson.dataValues)

            // 5. success response
            await transaction.commit()
            res.status(201).json(newLesson)

        } catch (err) {
            console.error(err);
            await transaction.rollback()
            throw err
        }
    }
)

export { router as addLessonRouter }