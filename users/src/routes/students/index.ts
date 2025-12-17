import express, { Request as ExpressRequest, Response } from 'express'
import { col, fn, Op, Order, where, WhereOptions } from 'sequelize'
import 'express-async-errors'

import {  Actions, Resources, StudentSpecificAttr, UserAttributes } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, requireAuth } from '@rkh-ms/classify-lib/middlewares'
import { validateRequest } from '@rkh-ms/classify-lib/middlewares'

import { Student } from '../../models/student'
import { User } from '../../models/user'
import { pageingQueryValidator } from '../../middlewares/paging-query-validators'
import { studentSortingQueryValidator } from '../../middlewares/student-sorting-query-validation'


const router = express.Router()

interface studentQuery {
    page?: string;
    limit?: string;
    sort?: string;
    sortDir?: string;
    search?: string;
    grades?: string;
}

router.get(`/api/users/students`,
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Student),
    pageingQueryValidator(),
    studentSortingQueryValidator(),
    validateRequest,
    async (req: ExpressRequest<any, any, any, studentQuery>, res: Response) => {
        const search = req.query.search

        //check if grade is an array of numbers
        const grades = req.query.grades ? req.query.grades.split(',')
            .map(g => parseInt(g)).filter(g => !isNaN(g)) : undefined

        const page = parseInt(req.query.page!) || 1
        const limit = parseInt(req.query.limit!) || 10

        //caculate offset (number of students to skip)
        const offset = (page * limit) - limit

        //parameters for sorting the students
        const sort = parseInt(req.query.sort!) || 1
        const sortDir = req.query.sortDir || 'ASC'

        let order: Order = []
        switch (sort) {
            //for case 1 order by user id
            case 1:
                order = [[{ model: User, as: 'users' }, 'id', sortDir]]
                break

            //case 2 order by firstName
            case 2:
                order = [[{ model: User, as: 'users' }, 'firstName', sortDir]]
                break

            //case 3 sort based on lastName
            case 3:
                order = [[{ model: User, as: 'users' }, 'lastname', sortDir]]
                break

            //case 4 sort based on email
            case 4:
                order = [[{ model: User, as: 'users' }, 'email', sortDir]]
                break

            case 5:
                order = [[{ model: User, as: 'users' }, 'phone', sortDir]]
                break;

            //case 6 order by grade
            case 6:
                order = [['grade', sortDir]]
                break
        }

        //filter based on students grades
        let studentWhere: WhereOptions<StudentSpecificAttr> | undefined = undefined
        if (grades && grades.length > 0)
            studentWhere = {
                grade: {
                    [Op.in]: grades
                }
            }


        //filter based on firstName and lastName
        let userWhere: WhereOptions<UserAttributes> | undefined = undefined
        if (search) {
            userWhere = where(fn('CONCAT', col('firstName'), ' ', col('lastName')), {
                [Op.like]: `%${search}%`
            })
            // {
            //     [Op.or]: [
            //         {
            //             firstName: {
            //                 [Op.like]: `%${search}%`
            //             }
            //         },
            //         {
            //             lastName: {
            //                 [Op.like]: `%${search}%`
            //             }
            //         }
            //     ]
            // }
        }

        //return all students and apply filters and order
        const students = await Student.findAndCountAll<Student & { User?: User }>({
            include: {
                model: User,
                required: true,
                where: userWhere,
                attributes: { exclude: ['password'] }
            },
            where: studentWhere,
            order,
            limit,
            offset
        })

        res.status(200).json({
            rows: students.rows,
            pagination: {
                totalItems: students.count,
                currentPage: page,
                totalPages: Math.ceil(students.count / limit)
            }
        })
    })

export { router as getStudentsRouter }