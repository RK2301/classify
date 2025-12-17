import express, { Request, Response } from 'express'
import 'express-async-errors'

import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, requireAuth, validateRequest } from '@rkh-ms/classify-lib/middlewares'

import { Student } from '../../models/student'
import { sequelize } from '../../connect'
import { User } from '../../models/user'
import { userValidate } from '../../middlewares/user-validate'
import { studentValidate } from '../../middlewares/student-validate'
import { UserUpdatedPublisher } from '../../rabbitMQ/publishers/user_updated_publisher'
import { StudentUpdatedPublisher } from '../../rabbitMQ/publishers/student_updated_publisher'

const router = express.Router()


router.put('/api/users/students',
    requireAuth,
    accessControlMiddleware(Actions.updateAny, Resources.Student),
    userValidate(),
    studentValidate(),
    validateRequest,
    async (req: Request, res: Response) => {
        const { id, firstName, lastName, email, phone, grade,
            motherName, motherPhone, fatherName, fatherPhone
        } = req.body

        //check if student already exists in the DB
        const user = await User.findOne({
            where: {
                id: id
            }
        })

        const student = await Student.findOne({
            where: {
                id: id
            }
        })
        if (!student || !user)
            throw new NotFoundError()

        //save current version, to check after updates in DB if 
        //to emit events describe update or no need
        const currentVersion = user.version
        const studentCurrentVersion = student.version

        //apply a transaction to update user and student data 
        const t = await sequelize.transaction()
        try {
            user.set({
                firstName, lastName, email, phone
            })
            await user.save({ transaction: t })

            student.set({
                grade,
                motherName,
                motherPhone,
                fatherName,
                fatherPhone
            })

            await student.save({ transaction: t })
            await t.commit()

            //publish event if user data or student changed (based on version value)
            //throw the event only if data of user and/or student changed
            //otherwise, no need to emit an event
            if (user.version > currentVersion)
                new UserUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(user.get())

            if (student.version > studentCurrentVersion)
                new StudentUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(student.get())

            res.status(200).send(JSON.stringify(user.get()))
        } catch (err) {
            console.error(err);
            await t.rollback()
            throw err
        }
    }
)

export { router as updateStudentRouter }