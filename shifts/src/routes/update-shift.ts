import express, { Request, Response } from 'express'
import 'express-async-errors'
import { body, param } from 'express-validator'
import { Op } from 'sequelize'

import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import {accessControlMiddleware, requireAuth, validateRequest} from '@rkh-ms/classify-lib/middlewares'

import { Shift } from '../models/shift'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(timezone)

const router = express.Router()

router.put('/api/shifts/:id',
    requireAuth,
    accessControlMiddleware(Actions.updateAny, Resources.Shift),
    [
        param('id')
            .isInt()
            .withMessage((value, { req }) => req.t('errors', 'ONLY_NUMBERS')),
        body('startTime')
            .exists()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isISO8601()
            .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE')),
        body('endTime')
            .exists()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isISO8601()
            .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE'))
            .custom((value, { req }) => {
                const endTime = new Date(value)
                const startTime = new Date(req.body.startTime)

                // start time can't be bigger than endTime
                if (startTime >= endTime)
                    throw new BadRequestError(req.t('errors', 'INVALID_START_TIME_SHIFT'))

                // shift can't end in the future
                if (endTime >= new Date())
                    throw new BadRequestError(req.t('errors', 'INVALID_END_TIME_SHIFT'))

                return true
            })

    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const { id } = req.params
        const { startTime: newStartTime, endTime: newEndTime } = req.body

        // 1. check if the shift to update exists in the DB
        const shift = await Shift.findByPk(id)
        if (!shift)
            throw new NotFoundError()

        // 2. check if the shift ended
        // shift must be end in order to update it's start/end time
        if (!shift.dataValues.endTime)
            throw new BadRequestError(req.t('errors', 'MUST_END_SHIFT'))

        // 3. check if there any collision between the new start/ end time with already exists
        // shifts for the given teacher
        console.log(`startTime ${new Date(newStartTime)}`);
        console.log(`endTime ${new Date(newEndTime)}`);
        console.log(`now time in ISO is: ${new Date().toISOString()}`);
        console.log(`now time is ${new Date().toLocaleString()}`);


        const conflicted_shfits = await Shift.findAll({
            where: {
                teacherId: shift.dataValues.teacherId,
                id: {
                    [Op.not]: id
                },
                [Op.or]: [{
                    startTime: {
                        [Op.lte]: newStartTime
                    },
                    endTime: {
                        [Op.gte]: newStartTime
                    }
                }, {
                    startTime: {
                        [Op.lte]: newEndTime
                    },
                    endTime: {
                        [Op.gte]: newEndTime
                    }
                }]
            }
        })

        // 4. if shifts founded then responses with error 
        // supply information about one of the collided shifts
        if (conflicted_shfits.length > 0) {
            const conflict_shift = conflicted_shfits[0]

            console.log('The conflicted shift data: ');
            console.log(conflict_shift.toJSON());

            // convert the start time, to israel timezone
            // get a format for dd/mm and hh:mm
            // get a format for endTime: hh:mm
            const startTimeConflicted = dayjs(conflict_shift.dataValues.startTime).tz('Asia/Jerusalem')
            const endTimeConflicted = dayjs(conflict_shift.dataValues.endTime).tz('Asia/Jerusalem')


            throw new BadRequestError(req.t('errors', 'SHIFT_CONFLICT', {
                day: startTimeConflicted.format('DD'),
                month: startTimeConflicted.format('MM'),
                start: startTimeConflicted.format('HH:mm'),
                end: endTimeConflicted.format('HH:mm')
            }))
        }

        // 5. no collisions found then update the start/ end time
        shift.set('startTime', newStartTime)
        shift.set('endTime', newEndTime)

        await shift.save()

        // 6. response with success
        res.json(shift)
    }
)

export { router as updateShiftRouter }