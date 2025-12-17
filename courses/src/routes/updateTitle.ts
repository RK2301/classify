import express, { Request, Response } from 'express'
import 'express-async-errors'
import { body } from 'express-validator'

import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { CourseKeys } from '@rkh-ms/classify-lib/enums'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { Course as CourseAttrs } from '@rkh-ms/classify-lib/interfaces'

import { Course } from '../models/Course'
import { validateCourseId } from '../util/validateCourseId'
import { CourseUpdatedPublisher } from '../rabbit_mq/publishers/CourseUpdatedPublisher'

const router = express.Router()

type RequestBody = Pick<CourseAttrs, CourseKeys.TITLE>

router.patch('/api/courses/title/:id',
    accessControlMiddleware(Actions.updateAny, Resources.Course),
    validateCourseId(),
    [
        body(CourseKeys.TITLE)
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED')),
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const { title } = (req.body) as RequestBody
        const course_id = Number(req.params.id)

        // update the course title
        const course = await Course.findByPk(course_id)
        if (!course)
            throw new NotFoundError()

        course.set({
            title
        })
        await course.save()

        // publish event indicate course updated
        new CourseUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(course.dataValues)

        res.json(course)
    }
)

export { router as updateCourseTitleRouter }