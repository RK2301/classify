import express, { Request, Response } from 'express'
import 'express-async-errors'
import dayjs from 'dayjs'
import { param } from 'express-validator'

import {accessControlMiddleware, requireAuth, validateRequest} from '@rkh-ms/classify-lib/middlewares'
import { Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { ForbiddenError, NotFoundError } from '@rkh-ms/classify-lib/errors'

import { isTeacherOwnShift } from '../utils/isTeacherOwnShift'
import { Shift } from '../models/shift'


const router = express.Router()

router.delete('/api/shifts/:id',
    requireAuth,
    accessControlMiddleware([Actions.deleteOwn, Actions.deleteAny], Resources.Shift),
    [
        param('id')
            .isInt()
            .withMessage((value, { req }) => req.t('errors', 'ONLY_NUMBERS'))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. read shift id value
        const shiftId = parseInt(req.params.id)

        // 2. check if the shift to delete is exists
        const shift = await Shift.findByPk(shiftId)
        if (!shift)
            throw new NotFoundError()

        // 3. if the user sent the request is teacher then check 
        // if the shift to delete it's own shift
        if (req.currentUser!.role === UserRole.Teacher) {
            await isTeacherOwnShift(req.currentUser!.id, shiftId)

            //teacher can delete shifts for the current month only
            const now = dayjs()
            const startTime = dayjs(shift.dataValues.startTime)

            //if teacher asks to delete shift start before this month
            // which mean in the past
            // so can't delete (only the current month)
            if (now.startOf('month') > startTime)
                throw new ForbiddenError(req.t('errors', 'ONLY_CURRENT_MONTH'))
        }

        // 4. delete the shift
        // * delete the shift will also delete it's notes if there any
        await shift.destroy()

        // 5. response with success
        res.status(204).send()
    }
)

export { router as deleteShiftRoute }