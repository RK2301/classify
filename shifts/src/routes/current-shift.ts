import express, { Request, Response } from 'express'
import 'express-async-errors';
import { Op } from 'sequelize';

import { Shift } from '../models/shift';

import { Actions, Resources } from '@rkh-ms/classify-lib'
import {accessControlMiddleware, requireAuth} from '@rkh-ms/classify-lib/middlewares'

const router = express.Router()

router.get('/api/shifts/current',
    requireAuth,
    accessControlMiddleware(Actions.readOwn, Resources.Shift),
    async (req: Request, res: Response) => {

        // 1. get current shift if there for the given teacher
        const shift = await Shift.findOne({
            where: {
                endTime: {
                    [Op.is]: null
                },
                teacherId: req.currentUser!.id
            }
        })

        // 2. response with current shift details
        // if there no current shift then simply the response will be undefined
        res.json({
            currentShift: shift ? shift : undefined
        })
    }
)

export { router as getCurrentShiftRouter }