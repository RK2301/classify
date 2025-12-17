import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import 'express-async-errors'
import jwt from 'jsonwebtoken';

import { NotFoundError } from '@rkh-ms/classify-lib/errors';
import { validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { SendEmail } from '@rkh-ms/classify-lib';

import { User } from '../models/user';
import { ResetPassword } from '../models/reset-password';
import { sequelize } from '../connect';
import { maskEmail } from '../utils/maskEmail';

const router = express.Router();

router.post('/api/reset-password/request',
    [
        body('id')
            .notEmpty()
            .withMessage('User id is required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        //first check if user exists in the DB
        const user = await User.findByPk(req.body.id)

        if (!user)
            throw new NotFoundError()

        //generate Password Reset Code
        const prc = Math.floor(1000 + Math.random() * 9000).toString();

        //start transaction to add reset_password record
        //and send an email to the user

        const t = await sequelize.transaction()
        try {

            //add Password Reset Code (PRC) to reset-password record
            const reset_pass = ResetPassword.build({
                userId: user.id,
                prc,
                expiresAt: new Date(Date.now() + 600000).toISOString(),
                prcSent: true,
                prcSentTime: new Date().toISOString()
            })

            await reset_pass.save({ transaction: t })

            //send OTP to user email
            await SendEmail.getInstance().sendEmail(
                user.email,
                'Reset Password Code',
                `
                  <h3> Dear ${user.firstName + ' ' + user.lastName}</h3>
                    <p>Your verfication code is: ${prc}</p>
                    <p>And it will expire in 10 minutes</p>
                `,
                true)

            await t.commit()

            //create a cookie-session to use next time in
            //validate the PRC
            const userJWT = jwt.sign(
                {
                    id: reset_pass.id,
                    used: reset_pass.used
                },
                process.env.JWT_KEY!,
                {
                    expiresIn: '10m'
                })

            req.session = {
                jwt: userJWT
            }

            res.status(201).send({
                message: req.t('errors', 'SUCCESS_EMAIL_SENT', { email: maskEmail(user.email) })
            })

        } catch (err) {
            console.error(err)
            await t.rollback()

            throw err
        }

    })

export { router as requestOTPRouter };