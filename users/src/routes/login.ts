import jwt from 'jsonwebtoken';
import 'express-async-errors'
import express, { Request, Response } from 'express';
import { body } from 'express-validator';

import { Password } from '@rkh-ms/classify-lib';
import { validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { BadRequestError } from '@rkh-ms/classify-lib/errors';

import { User } from '../models/user';


const router = express.Router();


router.post('/api/users/login',
    [
        body('id')
            .notEmpty()
            .withMessage('ID is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        //check if user id & password are correct
        //if correct, send a success message & create cookie with JWT
        const { id, password } = req.body;

        const user = await User.findOne({ where: { id } });
        if (!user)
            throw new BadRequestError(req.t('errors', 'INVALID_CREDENTIALS'));

        //check if password also corect
        const correctPass = await Password.compare(user.password, password);
        if (!correctPass)
            throw new BadRequestError(req.t('errors', 'INVALID_CREDENTIALS'));

        //create JWT inside a cookie
        const userJWT = jwt.sign({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role
        }, process.env.JWT_KEY!);

        req.session = {
            jwt: userJWT
        };

        res.status(200).send();
    });

export { router as loginRouter };