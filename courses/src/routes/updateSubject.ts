import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import 'express-async-errors'

import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { Course as CourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import { CourseKeys } from '@rkh-ms/classify-lib/enums'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'

import { checkSubjectExsiting } from '../middlewares/checkSubjectExisting'
import { Course } from '../models/Course'
import { validateCourseId } from '../util/validateCourseId'
import { CourseUpdatedPublisher } from '../rabbit_mq/publishers/CourseUpdatedPublisher'


const router = express.Router()

type RequestBody = Pick<CourseAttrs, CourseKeys.SUBJECT_ID>

router.patch('/api/courses/subject/:id',
    accessControlMiddleware(Actions.updateAny, Resources.Course),
    validateCourseId(),
    [
        body(CourseKeys.SUBJECT_ID)
            .isInt({ min: 0 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    checkSubjectExsiting,
    async (req: Request, res: Response) => {

        const courseId = Number(req.params.id)
        const subjectId = (req.body as RequestBody).subjectId

        //fecth the course from the DB
        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError()

        // update course subject to the new one
        course.set({
            [CourseKeys.SUBJECT_ID]: subjectId
        })
        await course.save()

        // publish event indicate course updated
        new CourseUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(course.dataValues)

        res.json(course)
    }
)

export { router as updateCourseSubjectRouter }