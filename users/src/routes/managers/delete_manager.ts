import express, { Request, Response } from 'express'
import 'express-async-errors'

import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { Actions, rabbitMQ_Wrapper, Resources, UserRole } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'

import { Manager } from '../../models/manager'
import { sequelize } from '../../connect'
import { User } from '../../models/user'
import { UserUpdatedPublisher } from '../../rabbitMQ/publishers/user_updated_publisher'
import { ManagerUpdatedPublisher } from '../../rabbitMQ/publishers/manager_updated_publisher'



const router = express.Router()

router.delete('/api/users/managers/:id',
    requireAuth,
    accessControlMiddleware(Actions.deleteAny, Resources.Manager),
    async (req: Request, res: Response) => {
        const { id } = req.params

        //first check if manager exists
        const manager = await Manager.findByPk(id)
        if (!manager)
            throw new NotFoundError()

        const user = await User.findByPk(id)

        const t = await sequelize.transaction()

        //delete manager data (set endDate to today, so no longer manager)
        manager.set({
            endDate: new Date().toISOString()
        })
        await manager.save({ transaction: t })

        //set it's role to teacher
        user!.set({
            role: UserRole.Teacher
        })
        await user!.save({ transaction: t })

        //emit user updated event
        await new UserUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(user!.get())

        //emit manager updated event
        await new ManagerUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(manager.get())

        await t.commit()
        res.status(200).send()

    })

export { router as deleteManagerRouter }