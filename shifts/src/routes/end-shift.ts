import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import 'express-async-errors';

import {accessControlMiddleware, requireAuth, validateRequest} from '@rkh-ms/classify-lib/middlewares'
import { Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'

import { isTeacherOwnShift } from '../utils/isTeacherOwnShift';
import { validateLocation } from '../middlewares/validateLocation';
import { Shift } from '../models/shift';


const router = express.Router()

router.put('/api/shifts/end',
    requireAuth,
    accessControlMiddleware([Actions.updateOwn, Actions.updateAny], Resources.Shift),
    [
        ...validateLocation('endLocation'),
        body('id')
            .exists()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isInt()
            .withMessage((value, { req }) => req.t('errors', 'ONLY_NUMBERS'))
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        // 1. retrieve the endLocation & the shiftId from the body
        const { endLocation, id } = req.body;

        // 2. check if the shift exists
        const shift = await Shift.findByPk(id);
        if (!shift) {
            throw new NotFoundError(req.t('errors', 'SHIFT_NOT_FOUND'));
        }

        // 3. check if the user teacher then check if the user is the owner of the shift
        if (req.currentUser?.role === UserRole.Teacher)
            await isTeacherOwnShift(req.currentUser.id, id)

        // 4. end the shift
        shift.set('endLocation', {
            type: 'Point',
            coordinates: endLocation
        })
        shift.set('endTime', new Date().toISOString())

        // 5. save changes
        await shift.save()

        // 6. response success
        res.json(shift)
    }
)

export { router as endShiftRouter }