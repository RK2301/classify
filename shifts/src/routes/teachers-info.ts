/**This route is about fetch teachers basic data
 * id + first name + last name
 * 
 * can be used when want to filter shifts based on specific teacher
 */
import express, { Request, Response } from 'express'
import 'express-async-errors'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import {accessControlMiddleware, requireAuth} from '@rkh-ms/classify-lib/middlewares'

import { User, UserMainAttributes } from '../models/user'

const router = express.Router()

router.get('/api/shifts/teachers-info',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Shift),
    async (req: Request, res: Response) => {

        //access the DB and get all teachers basic data
        const keys: (keyof UserMainAttributes)[] = ['id', 'firstName', 'lastName']

        const teachers = await User.findAll({
            attributes: keys
        })

        res.json(teachers)
    }
)

export { router as getTeachersInfo }