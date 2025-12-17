import express, { Request, Response } from 'express'
import { validatePrcMiddleware } from '../middlewares/validate-prc-middleware'
import { body } from 'express-validator'
import { Op } from 'sequelize'
import 'express-async-errors'
import jwt from 'jsonwebtoken'

import { BadRequestError } from '@rkh-ms/classify-lib/errors';
import { validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { ResetPassword } from '../models/reset-password'


const router = express.Router()

router.post('/api/reset-password/verify',
    validatePrcMiddleware,
    [
        body('prc')
            .notEmpty()
            .withMessage('Verification code is required')
            .matches(/^[0-9]{4}$/)
            .withMessage('Verification code must be 4 digits long')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { prc } = req.body

        try {

            //check if the prc is correct
            const reset_pass = await ResetPassword.findOne({
                where: {
                    id: req.validatePrc?.id,
                    expiresAt: {
                        [Op.gt]: (new Date().toISOString())
                    }
                }
            })

            if (!reset_pass)
                throw new BadRequestError(req.t('errors', 'CODE_EXPIRED'))

            if (reset_pass.prc !== prc)
                throw new BadRequestError(req.t('errors', 'INVALID_CODE'))

            //update the used to true
            reset_pass.used = true
            await reset_pass.save()

            //now set a new session for the reset password
            const token = jwt.sign(
                {
                    id: reset_pass.id,
                    used: reset_pass.used
                },
                process.env.JWT_KEY!,
                {
                    expiresIn: '5m'
                })

            req.session = {
                jwt: token
            }

            res.status(200).send()

        } catch (err) {
            console.error(err);
            throw err
        }
    })

export { router as verifyPrcRouter }