import express, { Request, Response } from 'express'
import { ForeignKeyConstraintError } from 'sequelize'
import 'express-async-errors'

import { Actions, rabbitMQ_Wrapper, Resources, UserRole } from '@rkh-ms/classify-lib'
import { validateRequest, requireAuth, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import {BadRequestError, DuplicatedError} from '@rkh-ms/classify-lib/errors'

import { userValidate } from '../../middlewares/user-validate'
import { teacherValidate } from '../../middlewares/teacher-validate'
import { sequelize } from '../../connect'
import { User } from '../../models/user'
import { Teacher } from '../../models/teacher'
import { TeacherCreatedPublisher } from '../../rabbitMQ/publishers/teacher_created_publisher'
import { TeacherSubjects } from '../../models/teacher_subject'

const router = express.Router()


router.post('/api/users/teachers',
    requireAuth,
    accessControlMiddleware(Actions.createAny, Resources.Teacher),
    userValidate(),
    teacherValidate(),
    validateRequest,
    async (req: Request, res: Response) => {
        const { id, firstName, lastName, email, phone
            , startDate
        } = req.body

        //check if teacher already exists
        const existsUser = await User.findByPk(id)
        if (existsUser)
            throw new DuplicatedError(req.t('errors', 'TEACHER_EXISTS'))

        //create a new teacher
        const t = await sequelize.transaction()
        try {
            //first create a user
            const user = User.build({
                id, firstName, lastName, email, phone, role: UserRole.Teacher
            })
            await user.save({ transaction: t })

            //create a teacher
            const teacher = Teacher.build({
                id: user.id,
                startDate: startDate
            })
            await teacher.save({ transaction: t })


            // add teacher subjects
            const subjects = req.body.subjects as number[];
            await TeacherSubjects.bulkCreate(subjects.map(s => ({
                teacherId: id as string,
                subjectId: s
            })), { transaction: t })

            //publish an event
            await new TeacherCreatedPublisher(rabbitMQ_Wrapper.channel).publish({
                ...user.get(),
                startDate: new Date(teacher.startDate).toISOString()
            })

            //commit the transaction
            await t.commit()
            res.status(201).send(teacher.toJSON())

        } catch (err) {
            console.error(err);
            await t.rollback()

            if (err instanceof ForeignKeyConstraintError)
                throw new BadRequestError(req.t('errors', 'SUBJECT_NOT_EXISTS'))

            throw err
        }
    })

export { router as newTeacherRouter }