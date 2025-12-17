import express, { Request, Response } from 'express'
import 'express-async-errors'

import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'

import { Teacher } from '../../models/teacher'
import { User } from '../../models/user'
import { Subject } from '../../models/subject'

const router = express.Router()


router.get('/api/users/teachers/:id',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Teacher),
    async (req: Request, res: Response) => {

        // 1. read the id
        const teacherId = req.params.id

        // 2. fetch teacher and check if exists
        const teacher = await Teacher.findByPk(teacherId, {
            include: [{
                model: User,
                required: true,
                attributes: {
                    exclude: ['password']
                }
            }, {
                model: Subject,
                through: {
                    attributes: []
                }
            }],
            subQuery: false
        },
        )

        // 3. if teacher not found then throw 404
        if (!teacher)
            throw new NotFoundError()

        // 4. response with teacher data
        res.json(teacher)
    }
)

export { router as GetTeacherRouter }