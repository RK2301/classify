// This route handle update request for a lesson
import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'
import { body } from 'express-validator'

import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { LessonKeys, LessonStatus } from '@rkh-ms/classify-lib/enums'
import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'

import { validateAddUpdateLesson } from '../../util/validate_add_update_lesson'
import { UpdatedLessonRequestBody } from '../../types/lessonRequestType'
import { Lesson } from '../../models/Lesson'
import { Course } from '../../models/Course'
import { LessonUpdatedPublisher } from '../../rabbit_mq/publishers/LessonUpdatedPublisher'
import { checkForCollision } from '../../util/checkForCollision'
import { sequelize } from '../../connect'
import { CourseUpdatedPublisher } from '../../rabbit_mq/publishers/CourseUpdatedPublisher'
import { reCalculateEndDate } from '../../util/reCalculateEndDate'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from "dayjs/plugin/customParseFormat"
import { API } from '@rkh-ms/classify-lib/api'
dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

const router = express.Router()

router.patch(API.lessons.main,
    accessControlMiddleware(Actions.updateAny, Resources.Lesson),
    [
        body(LessonKeys.ID)
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
        ,
        // indicate that also null is accepted as optinal value, so cancel will not be validated
        // if null of not passed (undefined)
        body('cancel')
            .optional({ values: 'null' })
            .isBoolean()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
    ],
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {

        const { id, cancel } = req.body as { cancel?: boolean, [LessonKeys.ID]: number }

        // if cancel not passed then continue to the next middleware
        // where trying to update lessons start/end time
        if (cancel === undefined || cancel === null)
            return next()


        //  1. check if lesson exists
        const lesson = await Lesson.findByPk(id)
        if (!lesson)
            throw new NotFoundError()


        //  2. allow cancel if status not completed
        if (lesson.dataValues.status === LessonStatus.COMPLETED)
            throw new BadRequestError(req.t('errors', 'CANNOT_CANCEL_COMPLETED_LESSON'))

        //  3. update lesson status to cancelled
        //  but if it is cancelled and cancel is false then calculate the status according to current time
        let newStatus: LessonStatus;

        if (!cancel && lesson.dataValues.status === LessonStatus.CANCELLED)
            // if the lesson is cancelled and the user want to un-cancel it
            // then set the status according to current time
            newStatus = dayjs().isBefore(dayjs(lesson.dataValues.startTime)) ? LessonStatus.SCHEDULED :
                dayjs().isAfter(dayjs(lesson.dataValues.endTime)) ? LessonStatus.COMPLETED : LessonStatus.ONGOING
        else
            newStatus = cancel ? LessonStatus.CANCELLED : lesson.dataValues.status

        lesson.set({
            status: newStatus
        })

        // after calling save, changed will become false
        // so saving now, if there any fields changed
        const changed = lesson.changed()

        // 4. save the lesson
        await lesson.save()

        //  5. emit event to RabbitMQ indicate lesson updated
        if (changed)
            new LessonUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(lesson.dataValues)

        //  6. success response
        res.json(lesson)
    },
    validateAddUpdateLesson(),
    validateRequest,
    async (req: Request, res: Response) => {

        const {
            id,
            date,
            startTime,
            endTime
        } = req.body as UpdatedLessonRequestBody

        //  1. check if lesson exists
        const lesson = await Lesson.findByPk<Lesson & { Course?: Course }>(id, {
            include: {
                model: Course
            }
        })
        if (!lesson)
            throw new NotFoundError()

        //  2. allow update if status not ongoing
        if (lesson.dataValues.status === LessonStatus.ONGOING)
            throw new BadRequestError(req.t('errors', 'LESSON_ONGOING'))


        //  3. check if new date before course started
        const lessonStart = dayjs(date)
        const courseStart = dayjs(lesson.Course!.dataValues.startDate)
        if (lessonStart.isBefore(courseStart))
            throw new BadRequestError(req.t('errors', 'LESSON_DATE_BEFORE_COURSE_START_DATE'))


        //  4. check for collisions
        const lessonStartTime = dayjs.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Jerusalem')
        const lessonEndTime = dayjs.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Jerusalem')

        //  call the function to check whenver there is a collisions  with other lessons
        await checkForCollision(lesson.Course!.dataValues.id, lessonStartTime.toDate(), lessonEndTime.toDate(),
            req, lesson.dataValues.id)


        const transaction = await sequelize.transaction()
        try {
            //  5. update lesson time and status
            lesson.set({
                startTime: lessonStartTime.toDate(),
                endTime: lessonEndTime.toDate(),
                status: dayjs().isAfter(lessonEndTime) ? LessonStatus.COMPLETED :
                    dayjs().isBefore(lessonStartTime) ? LessonStatus.SCHEDULED : LessonStatus.ONGOING
            })

            // to know later if there need to publish event to rabbitmq
            const lessonChnaged = lesson.changed()
            lesson.save({ transaction })

            // 4.1 check if end date of the course must be updated
            const changed = await reCalculateEndDate(lesson.Course!, transaction)
            if (changed) {
                // if end date changed then save change and publish course updated event
                await lesson.Course?.save({ transaction })
                new CourseUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(lesson.Course!.dataValues)
            }


            //  6. emit event to RabbitMQ indicate lesson updated
            if (lessonChnaged)
                new LessonUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(lesson.dataValues)
            await transaction.commit()

            //  7. success response
            res.json(lesson)

        } catch (err) {
            console.error(err);
            transaction.rollback();
            throw err
        }
    }
)


export { router as updateLessonRouter }