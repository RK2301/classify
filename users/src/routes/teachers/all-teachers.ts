import express, { Request, Response } from 'express'
import 'express-async-errors'
import { Op } from 'sequelize'

import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'

import { Teacher } from '../../models/teacher'
import { User } from '../../models/user'


const router = express()

/**This route is to get all teachers in the DB without any pagination.
 * The teacher returned, are the one that still active (not ended)
 * 
 * this route useful when assigning teachers to courses
 */
router.get('/api/users/teachers/allTeachers',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Teacher),
    async (req: Request, res: Response) => {


        const teachers = await Teacher.findAll({
            include: [{
                model: User,
                required: true,
                attributes: { exclude: ['password'] }
            }],
            where: {
                endDate: {
                    [Op.is]: null
                }
            }
        });

        res.json(teachers)
    }
)


export { router as getAllTeachersRouter }