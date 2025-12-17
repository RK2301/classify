import express, { Request, Response } from 'express'
import { Op } from 'sequelize'
import 'express-async-errors'

import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'

import { Teacher } from '../../models/teacher'
import { Manager } from '../../models/manager'
import { User } from '../../models/user'

const router = express.Router()


//This route to get all teachers that not managers or have been managers in the past
router.get('/api/users/teachers/non-managers',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Teacher),
    async (req: Request, res: Response) => {

        // make outer join from teachers on managers and get
        // teachers with thier manager id is null 
        // or endDate not null (so they have been managers at the past)
        const non_managers = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [{
                model: Teacher,
                required: true,
                attributes: [],
                include: [{
                    model: Manager,
                    required: false,
                    attributes: [],
                }],
            }],
            where: {
                [Op.or]: [{
                    '$Teacher.Manager.id$': {
                        [Op.is]: null
                    }
                }, {
                    '$Teacher.Manager.endDate$': {
                        [Op.not]: null
                    }
                }]
            }
        })


        //response with teachers basic data (id, firstname, lastname .....)
        res.json(non_managers)
    }

)

export { router as getNonManagersRouter }