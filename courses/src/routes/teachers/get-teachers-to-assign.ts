import express, { NextFunction, Request, Response } from 'express'
import { Op } from 'sequelize'
import 'express-async-errors'

import { Actions, PaginationResponse, Resources, UserAttributes } from '@rkh-ms/classify-lib'
import { TeacherAssignedStatus, TeacherCourseKeys } from '@rkh-ms/classify-lib/enums'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'


import { validateCourseId } from '../../util/validateCourseId'
import { TeacherCourse } from '../../models/TeacherCourse'
import { Teacher } from '../../models/Teacher'
import { User } from '../../models/User'
import { userSearchWhere } from '../../util/userSearchWhere'
import { API } from '@rkh-ms/classify-lib/api'

const router = express.Router()

router.get(`${API.teachers_course.main}/canAssigned/:id`,
    accessControlMiddleware(Actions.readAny, Resources.TeacherCourse),
    validateCourseId(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. read course id
        const courseId = Number(req.params.id)

        // 2. get pagination parameters
        const page = parseInt(req.query.page as string) || 1
        const search = req.query.search as string || null
        const offset = (page * 10) - 10

        try {
            // 3. fetch all teacher that can assigned to the course
            // teacher can be assigned to a course
            // if it's never assigned to it
            // or assigned in the past and unassigned later
            const teacherToAssign = await Teacher.findAndCountAll<Teacher & { User?: UserAttributes }>({
                include: [
                    {
                        model: User,
                        required: true,
                        where: search ? userSearchWhere(search) : undefined
                    },
                    {
                        model: TeacherCourse,
                        required: false,
                        where: {
                            [TeacherCourseKeys.COURSE_ID]: courseId
                        },
                        attributes: []
                    }
                ],
                where: {
                    [Op.or]: [
                        { "$TeacherCourses.teacherId$": null },
                        {
                            "$TeacherCourses.status$": {
                                [Op.ne]: TeacherAssignedStatus.ASSIGNED
                            }
                        }
                    ]
                },
                subQuery: false,
                distinct: true,
                offset,
                limit: 10
            })

            res.json({
                rows: teacherToAssign.rows,
                pagination: {
                    totalPages: Math.ceil(teacherToAssign.count / 10),
                    currentPage: page,
                    totalItems: teacherToAssign.count
                }
            } as PaginationResponse<Teacher & { User?: UserAttributes }>)
        } catch (err) {
            console.error(err);
            throw err
        }
    }
)


export { router as getTeachersToAssign }