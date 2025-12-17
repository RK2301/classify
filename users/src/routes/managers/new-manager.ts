import express, { Request, Response } from 'express'
import 'express-async-errors'

import { BadRequestError } from '@rkh-ms/classify-lib/errors'
import { validateRequest } from '@rkh-ms/classify-lib/middlewares'

import { managerValidate } from '../../middlewares/manager-validate'
import { Manager } from '../../models/manager'
import { sequelize } from '../../connect'
import { User } from '../../models/user'
import { rabbitMQ_Wrapper, UserRole } from '@rkh-ms/classify-lib'
import { UserUpdatedPublisher } from '../../rabbitMQ/publishers/user_updated_publisher'
import { ForeignKeyConstraintError } from 'sequelize'
import { ManagerCreatedPublisher } from '../../rabbitMQ/publishers/manager_created_publisher'

const router = express.Router()

router.post('/api/users/managers',
    managerValidate(),
    validateRequest,
    async (req: Request, res: Response) => {
        const { id } = req.body

        const t = await sequelize.transaction()
        try {
            //first check if manager already exists in the DB
            let manager = await Manager.findByPk(id)

            //if manager already in the DB
            //sets startDate to today and endDate to null
            if (manager)
                manager.set({
                    startDate: new Date().toISOString(),
                    endDate: null
                })
            else
                manager = Manager.build({ id, startDate: new Date().toISOString() })

            //first try to add the manager to the DB
            //then update user role to manager
            await manager.save({ transaction: t })

            const user = await User.findByPk(id)

            user!.set({
                role: UserRole.Manager
            })
            await user!.save({ transaction: t })

            //emit event suggest user updated
            await new UserUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(user!.get())

            //emit event suggest manager created
            await new ManagerCreatedPublisher(rabbitMQ_Wrapper.channel).publish(manager.get())

            await t.commit()
            res.status(201).send(manager.toJSON())
        } catch (err) {
            console.log(err);
            await t.rollback()

            if (err instanceof ForeignKeyConstraintError)
                throw new BadRequestError('Teacher Not Exists')

            throw err
        }
    })

export { router as newManagerRouter }