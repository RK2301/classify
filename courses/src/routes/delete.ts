import express, { Request, Response } from 'express'
import 'express-async-errors'

import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'

import { Course } from '../models/Course'
import { validateCourseId } from '../util/validateCourseId'
import { CourseDeletedPublisher } from '../rabbit_mq/publishers/CourseDeletedPublisher'

const router = express.Router()

router.delete('/api/courses/:id',
    accessControlMiddleware(Actions.deleteAny, Resources.Course),
    validateCourseId(),
    validateRequest,
    async (req: Request, res: Response) => {

        const courseId = Number(req.params.id)

        // 1. check if course exists
        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError()

        // 2. delete the course
        await course.destroy()

        // 3. emit event indiacte course deleted
        new CourseDeletedPublisher(rabbitMQ_Wrapper.channel).publish({
            id: courseId
        })

        res.status(204).send()
    }
)


export { router as deleteCourseRouter }