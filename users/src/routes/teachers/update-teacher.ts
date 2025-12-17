import express, { Request, Response } from 'express'
import 'express-async-errors'
import { ForeignKeyConstraintError, Op } from 'sequelize'

import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, requireAuth, validateRequest } from '@rkh-ms/classify-lib/middlewares'

import { userValidate } from '../../middlewares/user-validate'
import { teacherValidate } from '../../middlewares/teacher-validate'
import { Teacher } from '../../models/teacher'
import { User } from '../../models/user'
import { sequelize } from '../../connect'
import { UserUpdatedPublisher } from '../../rabbitMQ/publishers/user_updated_publisher'
import { TeacherUpdatedPublisher } from '../../rabbitMQ/publishers/teacher_updated_publisher'
import { TeacherSubjects } from '../../models/teacher_subject'

const router = express.Router()


router.put('/api/users/teachers',
    requireAuth,
    accessControlMiddleware(Actions.updateAny, Resources.Teacher),
    userValidate(),
    teacherValidate(),
    validateRequest,
    async (req: Request, res: Response) => {
        const { id, firstName, lastName, email, phone
            , startDate, endDate } = req.body

        // console.log(req.body)

        //check if teacher already exists
        const teacher = await Teacher.findByPk<Teacher & { User?: User }>(id, {
            include: {
                model: User,
                required: true
            }
        })
        if (!teacher)
            throw new NotFoundError()

        // console.log(typeof teacher.startDate);

        const t = await sequelize.transaction()

        try {
            //start the transaction
            teacher.set({
                startDate, endDate: endDate === undefined ? null : endDate
            });
            await teacher.save({ transaction: t })

            teacher.User?.set({
                firstName, lastName,
                email: email === undefined ? null : email,
                phone: phone === undefined ? null : phone
            })
            await teacher.User?.save({ transaction: t })


            // check what subjects needs to be added or deleted
            const teacherSubjects = (await TeacherSubjects.findAll({
                where: {
                    teacherId: id
                }
            })).map(s => s.dataValues.subjectId)

            const subjects = req.body.subjects as number[]
            const subjectsToDelete = teacherSubjects.filter(s => !subjects.includes(s))
            const subjectsToAdd = subjects.filter(s => !teacherSubjects.includes(s))

            // turn a query to add or update accordingly
            if (subjectsToDelete.length > 0)
                await TeacherSubjects.destroy({
                    where: {
                        teacherId: id,
                        subjectId: {
                            [Op.in]: subjectsToDelete
                        }
                    },
                    transaction: t
                })

            if (subjectsToAdd.length > 0)
                await TeacherSubjects.bulkCreate(subjectsToAdd.map(s => ({
                    teacherId: id,
                    subjectId: s
                })), { transaction: t })


            //emit event to indicate user or/and teacher data updated
            if (teacher.User?.changed())
                await new UserUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(teacher.User!.get())

            if (teacher.changed())
                await new TeacherUpdatedPublisher(rabbitMQ_Wrapper.channel).publish({
                    id: teacher.id,
                    startDate: teacher.startDate,
                    endDate: teacher.endDate,
                    version: teacher.version
                })

            await t.commit()
            res.status(200).send(teacher.dataValues)
        } catch (err) {
            console.error(err);
            await t.rollback()

            if (err instanceof ForeignKeyConstraintError)
                throw new BadRequestError(req.t('errors', 'SUBJECT_NOT_EXISTS'))

            throw err
        }
    })

export { router as updateTeacherRouter }