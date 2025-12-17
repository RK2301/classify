import express, { Request, Response } from 'express'
import 'express-async-errors'

import {  Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { BadRequestError, ForbiddenError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'

import { Student } from '../../models/student'
import { User } from '../../models/user'

const router = express.Router()

router.get('/api/users/students/:studentId',
    requireAuth,
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Student),
    async (req: Request, res: Response) => {

        //read studentId
        const studnetId = req.params.studentId

        //check if student read it's own resource
        if (req.currentUser?.role === UserRole.Student && studnetId !== req.currentUser?.id)
            throw new ForbiddenError()


        //check if studentID is valid and contain numbers only
        if (!/^[0-9]+$/.test(studnetId))
            throw new BadRequestError('Invalid studentId. Only numeric values are allowed.')

        //get student data
        const student = await Student.findByPk<Student & { User?: User }>(studnetId, {
            include: {
                model: User,
                required: true,
                attributes: {
                    exclude: ['password']
                }
            }
        })

        //if student not found then throw 404 error
        if (!student)
            throw new NotFoundError()

        //res with studnet data
        res.json(student)
    }
)

export { router as getStudnetByIdRouter }