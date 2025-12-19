import 'express-async-errors'
import dayjs from 'dayjs'
import express, { Request, Response } from 'express'
import { Op, WhereOptions } from 'sequelize'

import { Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { Shift as ShiftAttr } from '@rkh-ms/classify-lib'
import {accessControlMiddleware, requireAuth} from '@rkh-ms/classify-lib/middlewares'

import { Shift } from '../models/shift'
import { User, UserMainAttributes } from '../models/user'

const router = express.Router()

router.get('/api/shifts',
    requireAuth,
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Shift),
    async (req: Request, res: Response) => {

        const now = dayjs()

        // 1. read current month and year to filter shifts based on
        // if user not provide any month or year then provide current month & year
        const month = parseInt(req.query.m as string) || now.month() + 1
        const year = parseInt(req.query.y as string) || now.year()

        // 2. determine the range
        // which mean what is first & last day of the given month
        const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate()
        const endDate = dayjs(startDate).endOf('month').toDate()

        let where: WhereOptions<ShiftAttr> = {
            startTime: {
                [Op.between]: [startDate, endDate]
            }
        }

        // 3. if manager then can be also filtered based on teachers id
        // if the user is teacher then will filter based on his id
        if (req.currentUser!.role === UserRole.Manager) {

            // read teachers params
            const teacher = req.query.teacher ? req.query.teacher.toString()
                : undefined

            // if manager don't want to filter teachers based on their ID
            // then no need for the where as will return all shifts for any teacher
            if (teacher)
                where = {
                    ...where,
                    teacherId: teacher
                }

        } else
            where = {
                ...where,
                teacherId: req.currentUser!.id
            }



        // 5. fetch the relevant shifts
        const shifts = await Shift.findAll<Shift & { User?: UserMainAttributes }>({
            include: {
                model: User,
                required: true
            },
            where,
            order: [['startTime', 'DESC']]
        })

        res.json(shifts)
    }
)

export { router as getShiftsRouter }