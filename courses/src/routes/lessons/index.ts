import express, { Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import { API } from '@rkh-ms/classify-lib/api'

import { CanAccessCourse } from '../../middlewares/canAccessCourse'
import { Lesson } from '../../models/Lesson'
import { LessonKeys } from '@rkh-ms/classify-lib/enums'

const router = express.Router()

router.get(`${API.lessons.main}/:id`,
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Lesson),
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),
    ],
    validateRequest,
    CanAccessCourse,
    async (req: Request, res: Response) => {

        //  1. read course id
        const courseId = Number(req.params.id)


        //  2. return all lessons data based on search params
        const lessons = await Lesson.findAll({
            where: {
                course_id: courseId,
            },
            order: [[LessonKeys.START_TIME, 'ASC']]
        })

        //  3. response with data
        res.json(lessons)

    }
)

export { router as getLessonsRouter }