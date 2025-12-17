import express, { Request, Response } from 'express'
import { Op, Order, WhereOptions } from 'sequelize'
import { Manager } from '../../models/manager'
import { User } from '../../models/user'
import 'express-async-errors'
import { Teacher } from '../../models/teacher'
import {
    Actions,
    ManagerSpecificAttr,
    Resources,
    UserAttributes
} from '@rkh-ms/classify-lib'
import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'

import { userSearchWhere } from '../../services/userSearchWhere'

const router = express.Router()

router.get('/api/users/managers',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Manager),
    async (req: Request, res: Response) => {

        //accept the query params
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10

        //accept sort & filter query params
        const sort = Number(req.query.sort) || 1
        const sortDir = req.query.sortDir ? String(req.query.sortDir) : 'ASC'

        const endDate = req.query.endDate === 'true' ? true :
            req.query.endDate === 'false' ? false : undefined
        const search = req.query.search

        //calculate offset (number of managers to skip)
        const offset = (page * limit) - limit

        //sort the managers based on some field
        let field = ''
        let order: Order = []

        switch (sort) {
            //case 1 sort based on id
            case 1:
                field = 'id'
                break

            //case 2 sort based on firstName
            case 2:
                field = 'firstName'
                break

            //case 3 sort based on lastName
            case 3:
                field = 'lastName'
                break

            //case 4 sort based on email
            case 4:
                field = 'email'
                break

            case 5:
                field = 'phone'
                break;

            case 6:
                field = 'startDate'
                break

            case 7:
                field = 'endDate'
                break
        }

        //1 to 5 are field related to users table
        if (sort >= 1 && sort <= 5)
            order = [[{ model: Teacher, as: 'teachers' }, { model: User, as: 'users' }, field, sortDir]]
        else
            order = [[field, sortDir]]


        //filter manager based on endDate
        //if true return all manager have endDate 
        //which mean they are no longer managers
        //else: return all manager which currently still managers 
        let whereManager: WhereOptions<ManagerSpecificAttr> | undefined = undefined
        if (endDate === true)
            whereManager = {
                endDate: {
                    [Op.not]: null
                }
            }
        else if (endDate === false)
            whereManager = {
                endDate: {
                    [Op.is]: null
                }
            }

        let userWhere: WhereOptions<UserAttributes> | undefined = undefined
        if (search)
            userWhere = userSearchWhere(String(search))

        const managers = await Manager.findAndCountAll<Manager & { Teacher?: Teacher & { User?: User } }>({
            include: [
                {
                    model: Teacher,
                    required: true,
                    include: [
                        {
                            model: User,
                            required: true,
                            attributes: { exclude: ['password'] },
                            where: userWhere,
                            as: 'User'
                        }
                    ],
                    as: 'Teacher'
                }
            ],
            where: whereManager,
            offset,
            limit,
            order
        })

        res.status(200).json({
            rows: managers.rows,
            pagination: {
                totalItems: managers.count,
                currentPage: page,
                totalPages: Math.ceil(managers.count / limit)
            }
        })
    })

export { router as getManagersRouter }