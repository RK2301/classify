import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import 'express-async-errors'
import { Op } from 'sequelize'

import { Course as CourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import { CourseKeys, LessonStatus } from '@rkh-ms/classify-lib/enums'
import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'

import { Course } from '../models/Course'
import { Lesson } from '../models/Lesson'
import { sequelize } from '../connect'
import { validateCourseId } from '../util/validateCourseId'
import { CourseUpdatedPublisher } from '../rabbit_mq/publishers/CourseUpdatedPublisher'


import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'


dayjs.extend(utc)
dayjs.extend(timezone)

const router = express.Router()

type RequestBody = Pick<CourseAttrs, CourseKeys.START_DATE>

router.patch('/api/courses/startDate/:id',
    accessControlMiddleware(Actions.updateAny, Resources.Course),
    validateCourseId(),
    [
        body(CourseKeys.START_DATE)
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isISO8601()
            .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE'))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const course_id = Number(req.params.id)
        const startDate = (req.body as RequestBody).startDate

        const newStartDate = dayjs(startDate).tz('Asia/Jerusalem').format('YYYY-MM-DD')

        // check if course exists
        const course = await Course.findByPk(course_id)
        if (!course)
            throw new NotFoundError()

        // check if start date can be updated
        // note: start date can be updated if there are not lessons before the new date
        // is completed or ongoing

        // 1. get all lessons that have start date before the new start date for the course
        const lessons = await Lesson.findAll({
            where: {
                startTime: {
                    [Op.lt]: newStartDate
                },
                course_id
            }
        })


        // 2. if a lesson with completed or ongoing status found then return error
        const completed_ongoing = lessons.filter(lesson => lesson.dataValues.status === LessonStatus.COMPLETED
            || lesson.dataValues.status === LessonStatus.CANCELLED)

        if (completed_ongoing.length > 0)
            throw new BadRequestError(req.t('errors', 'CANNOT_UPDATE_COURSE_START_DATE'))


        // 3. if no completed or ongoing lessons found then update the course start date
        // and deleted all scheduled or cancelled lessons if there any
        const transaction = await sequelize.transaction()
        try {
            // 1. update the course start date
            course.set({
                [CourseKeys.START_DATE]: newStartDate
            })

            // 2. if there are scheduled or cancelled lessons then delete them
            const scheduled_cancelled = lessons.filter(lesson => lesson.dataValues.status === LessonStatus.CANCELLED
                || lesson.dataValues.status === LessonStatus.SCHEDULED)
                .map(lesson => lesson.dataValues.id)

            if (scheduled_cancelled.length > 0) {
                await Lesson.destroy({
                    where: {
                        id: {
                            [Op.in]: scheduled_cancelled
                        }
                    },
                    transaction
                })

                // update number of lessons for the course
                course.set({
                    [CourseKeys.NUMBER_OF_LESSONS]: course.dataValues.numberOfLessons - scheduled_cancelled.length
                })

                // emit event indicate some lessons deleted
            }

            // 3. save changes to course
            await course.save({ transaction })

            // 4. emit event indicate course changed
            new CourseUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(course.dataValues)

            await transaction.commit()
            res.json(course)

        } catch (err) {
            console.error(err);
            transaction.rollback()
            throw err
        }
    }
)

export { router as updateCourseStartTimeRouter }