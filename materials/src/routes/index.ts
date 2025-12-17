import express, { Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'

import { Course } from '../models/Course'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { isStudentEnrolled } from '../utils/isStudentEnrolled'
import { Material } from '../models/Material'
import { MaterialFiles } from '../models/MaterialFiles'
import { MaterialFilesKeys } from '@rkh-ms/classify-lib/enums'

const router = express.Router()

router.get('/api/courses/:courseId/materials',
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Materials),
    [
        param('courseId')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const courseId = Number(req.params.courseId)

        // check if the course exists
        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError()

        // if teacher make the request then check if assigend to the course
        await isTeacherAssigned(courseId, req)

        // if studnet make the request, then check if enrolled for the course
        await isStudentEnrolled(courseId, req)

        //  return course materials
        const materials = await Material.findAll({
            include: {
                model: MaterialFiles,
                required: false,
                attributes: { exclude: [MaterialFilesKeys.URL] }
            },
            where: {
                courseId
            }
        })

        res.json(materials)
    }
)

export { router as getMaterialsRouter };