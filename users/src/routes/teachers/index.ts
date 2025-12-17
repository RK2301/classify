import express, { Request, Response } from 'express'
import 'express-async-errors'
import { Op, Order, WhereOptions } from 'sequelize'

import { Actions, Resources, TeacherSpecificAttr, UserAttributes } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'

import { userSearchWhere } from '../../services/userSearchWhere'
import { Subject } from '../../models/subject'
import { Teacher } from '../../models/teacher'
import { User } from '../../models/user'

const router = express()

router.get('/api/users/teachers',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Teacher),
    async (req: Request, res: Response) => {

        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10

        const sort = Number(req.query.sort) || 1
        const sortDir = req.query.sortDir ? String(req.query.sortDir) : 'ASC'

        const endDate = req.query.endDate === 'true' ? true :
            req.query.endDate === 'false' ? false : undefined
        const search = req.query.search


        //calculate offset (number of teachers to skip)
        const offset = (page * limit) - limit

        //based on sort value and direction sort the result
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
            order = [[{ model: User, as: 'users' }, field, sortDir]]
        else
            order = [[field, sortDir]]

        //handle filter teacher based on endDate
        let whereTeacher: WhereOptions<TeacherSpecificAttr> | undefined = undefined

        //if passed endDate as true then return all teachers that
        //finished work, so their endDate is defined
        if (endDate === true)
            whereTeacher = {
                endDate: {
                    [Op.not]: null
                }
            }
        else if (endDate === false)
            whereTeacher = {
                endDate: {
                    [Op.is]: undefined
                }
            }

        let userWhere: WhereOptions<UserAttributes> | undefined = undefined
        if (search)
            userWhere = userSearchWhere(String(search))


        //get all teachers from DB
        const teachers = await Teacher.findAndCountAll<Teacher & { User?: User }>({
            include: [{
                model: User,
                required: true,
                where: userWhere,
                attributes: { exclude: ['password'] }
            }, {
                model: Subject,
                through: {
                    attributes: []
                }
            }],
            where: whereTeacher,
            order,
            offset,
            limit,
            subQuery: false,
            distinct: true
        });


        res.status(200).json({
            rows: teachers.rows,
            pagination: {
                totalItems: teachers.count,
                currentPage: page,
                totalPages: Math.ceil(teachers.count / limit)
            }
        })
    })

export { router as getTeachersRouter }