import express, { Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'

import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import { CourseKeys } from '@rkh-ms/classify-lib/enums'

import { Lesson } from '../../models/Lesson'
import { sequelize } from '../../connect'
import { Course } from '../../models/Course'
import { LessonDeletedPublisher } from '../../rabbit_mq/publishers/LessonDeleted'
import { CourseUpdatedPublisher } from '../../rabbit_mq/publishers/CourseUpdatedPublisher'
import { reCalculateEndDate } from '../../util/reCalculateEndDate'
import { API } from '@rkh-ms/classify-lib/api'

const router = express.Router()

router.delete(`${API.lessons.main}/:id`,
    accessControlMiddleware(Actions.deleteAny, Resources.Lesson),
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const id = Number(req.params.id)

        //  1. check if lesson exists
        const lesson = await Lesson.findByPk<Lesson & { Course?: Course }>(id, {
            include: {
                model: Course,
                required: true
            }
        })
        if (!lesson)
            throw new NotFoundError()


        //  2. retireve the course related to the lesson
        // if lesson found then of the course must exists
        const course = await Course.findByPk(lesson.Course?.dataValues.id)

        const transaction = await sequelize.transaction()
        try {

            //  3. delete the lesson
            await lesson.destroy({ transaction })

            //  4. get last lesson and check if end date must be updated
            await reCalculateEndDate(course!, transaction)

            //  4.1 reduce lessons number for the course by 1
            course!.set({
                [CourseKeys.NUMBER_OF_LESSONS]: course!.dataValues.numberOfLessons - 1
            })

            await course!.save({ transaction })

            await transaction.commit()

        } catch (err) {
            console.error(err);
            await transaction.rollback()
            throw err
        }

        //  5. emit delete event
        new LessonDeletedPublisher(rabbitMQ_Wrapper.channel).publish({ id })
        new CourseUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(course!.dataValues)

        //  6. success response
        res.status(204).send()
    }
)


export { router as deleteLessonRouter }