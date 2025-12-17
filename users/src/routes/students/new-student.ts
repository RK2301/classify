import express, { Request, Response } from 'express';
import 'express-async-errors';

import { DuplicatedError } from '@rkh-ms/classify-lib/errors';
import {  Actions, rabbitMQ_Wrapper, Resources, UserRole } from '@rkh-ms/classify-lib';
import { accessControlMiddleware, requireAuth, validateRequest, cleanEmptyFields } from '@rkh-ms/classify-lib/middlewares'

import { StudentCreatedPublisher } from '../../rabbitMQ/publishers/student_created_publisher';
import { sequelize } from '../../connect';
import { Student } from '../../models/student';
import { userValidate } from '../../middlewares/user-validate';
import { studentValidate } from '../../middlewares/student-validate';
import { User } from '../../models/user';

const router = express.Router();

router.post('/api/users/students',
    requireAuth,
    accessControlMiddleware(Actions.createAny, Resources.Student),
    cleanEmptyFields,
    userValidate(),
    studentValidate(),
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {

        //create a new user & save it to the database
        const { id, firstName, lastName, email, phone, grade,
            motherName, fatherName, motherPhone, fatherPhone } = req.body;

        //check if user already exists
        const existsUser = await User.findByPk(id)
        if (existsUser)
            throw new DuplicatedError(req.t('errors', 'STUDENT_EXISTS'))



        const t = await sequelize.transaction()

        try {
            const user = User.build({ id, firstName, lastName, email, phone, role: UserRole.Student });
            await user.save({ transaction: t });

            //create new student
            const student = Student.build({ id: user.id, grade, motherName, motherPhone, fatherName, fatherPhone })
            await student.save({ transaction: t })

            //emit event to add new student
            // await new StudentCreatedPublisher(rabbitMQ_Wrapper.channel).publish({
            //     id: user.id,
            //     firstName: user.firstName,
            //     lastName: user.lastName,
            //     role: user.role,
            //     grade: grade,
            //     version: user.version,
            //     email: user.email,
            //     phone: user.phone,
            //     motherName,
            //     fatherName,
            //     motherPhone,
            //     fatherPhone
            // })

            await new StudentCreatedPublisher(rabbitMQ_Wrapper.channel).publish({
                ...user.dataValues,
                ...student.dataValues
            })

            //commit changes to the DB
            await t.commit()
            res.status(201).send(user.toJSON());
        } catch (err) {
            console.error(err);

            await t.rollback()
            throw err
        }
    });

export { router as newStudentRouter };