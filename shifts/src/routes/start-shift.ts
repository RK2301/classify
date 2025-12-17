import express, { Request, Response } from 'express'
import { Op } from 'sequelize'
import 'express-async-errors';

import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { BadRequestError } from '@rkh-ms/classify-lib/errors'
import {accessControlMiddleware, requireAuth, validateRequest} from '@rkh-ms/classify-lib/middlewares'

import { Shift } from '../models/shift'
import { validateLocation } from '../middlewares/validateLocation';



const router = express.Router()

router.post('/api/shifts/start',
    requireAuth,
    //only teachers can start shifts
    accessControlMiddleware(Actions.createAny, Resources.Shift),
    validateLocation('startLocation'),
    validateRequest,
    async (req: Request, res: Response) => {
        // 1. retireve the startLocation from the body
        const { startLocation } = req.body;


        // 2. check if the user has a shift that is not ended
        const currentShift = await Shift.findOne({
            where: {
                teacherId: req.currentUser?.id,
                endTime: {
                    [Op.is]: null // means the shift is not ended
                }
            }
        })

        // 3. if the user has a shift that is not ended, return an error
        if (currentShift)
            throw new BadRequestError(req.t('errors', 'ALREADY_ACTIVE_SHIFT'))


        // 4. create a new shift with the startTime and startLocation
        const shift = await Shift.create({
            teacherId: req.currentUser!.id,
            startTime: new Date().toISOString(),
            startLocation: {
                type: 'Point',
                coordinates: startLocation
            }
        })

        // 5. response with the created shift
        res.status(201).json(shift)
    }
)

export { router as startShiftRouter }