import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import 'express-async-errors'

import { validatePrcMiddleware } from '../middlewares/validate-prc-middleware'
import { NotFoundError, BadRequestError } from '@rkh-ms/classify-lib/errors';
import { validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { rabbitMQ_Wrapper, SendEmail } from '@rkh-ms/classify-lib'

import { ResetPassword } from '../models/reset-password'
import { RequestResetPasswordPublisher } from '../rabbitMQ/publishers/request-reset-password-publisher'
import { User } from '../models/user'

const router = express.Router()

router.put('/api/reset-password/reset',
    validatePrcMiddleware,
    [
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long\n')
            .matches(/\d/)
            .withMessage('Password must contain at least 1 number\n')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least 1 uppercase letter\n')
            .matches(/[a-z]/)
            .withMessage('Password must contain at least 1 lowercase letter\n'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Password confirmation does not match password')
                }
                return true
            })
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { password } = req.body

        //get the reset password record for change the password 
        //based on the id from the validatePrc which is object
        //created when the user submite a correct code for reset the password
        //this object data sent throught cookie-session
        const reset_pass = await ResetPassword.findOne({
            where: {
                id: req.validatePrc?.id
            }
        })

        //record for reset password not exists
        if (!reset_pass)
            throw new NotFoundError()

        //if user not entered the correct PRC
        //and request to change the password
        if (!reset_pass.used)
            throw new BadRequestError('First must sent a valid Password Reset Code')

        //get user data to send a email, 
        //in case reset password successed
        const user = await User.findByPk(reset_pass.userId)

        //update the password
        const reqResetPassword = new RequestResetPasswordPublisher(rabbitMQ_Wrapper.channel, res)
        await reqResetPassword.publish({
            id: reset_pass.userId,
            password: password
        })

        //wait for successfully updated password by users service
        await reqResetPassword.consume()

        //send email to the user that password has been changed
        //not important if error occured during sending the email
        SendEmail.getInstance().sendEmail(
            user!.email,
            'Password Changed Successfully',
            `
                <h2> Hello, ${user!.firstName + ' ' + user!.lastName} </h2>
                <p> Your password has changed successfully </p>
            `,
            true
        )
            .catch(err => { })


        //try to update passwordChangedAt attribute
        const re_try = async (attempt = 1) => {
            try {
                //update password changedAt field (to-do)
                reset_pass.passwordChangedAt = new Date().toISOString()
                await reset_pass.save()
            } catch (err) {

                if (attempt < 3) {
                    console.error(err);
                    setTimeout(() => { re_try(attempt + 1) }, 2000);
                } else {
                    console.error(`Failed all ${attempt} attempts`, err);
                    //can marked for future reconciliation
                }

            }
        }
        re_try()

        //destroy the session-cookie
        req.session = null

        res.status(200).send()
    })

export { router as resetRouter }