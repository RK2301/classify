import express, { Request, Response } from 'express'
import 'express-async-errors'

import { Actions, getPaginationParams, PaginationResponse, Resources } from '@rkh-ms/classify-lib'
import { validateCourseId } from '../../util/validateCourseId'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'

import { Course } from '../../models/Course'
import { Student } from '../../models/Student'
import { StudentCourse } from '../../models/StudentCourse'
import { User } from '../../models/User'
import { Op } from 'sequelize'
import { StudentCourseKeys, StundetEnrollmentStatus } from '@rkh-ms/classify-lib/enums'
import { userSearchWhere } from '../../util/userSearchWhere'
import { API } from '@rkh-ms/classify-lib/api'


const router = express.Router()

router.get(`${API.students_course.main}/canEnrolled/:id`,
    accessControlMiddleware(Actions.readAny, Resources.StudentCourse),
    validateCourseId(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. get course id
        const courseId = parseInt(req.params.id)

        // 2. check if course exists
        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError(req.t('errors', 'COURSE_NOT_FOUND'))

        // 3. get pagination params
        const { page, limit, offset } = getPaginationParams(req)
        const search = req.query.search as string || null

        // 4. get all students that can be enrolled for the course
        // student can be enrolled if:
        // * not enrolled for the course at all
        // * enrolled but later withdraw
        const students = await Student.findAndCountAll({
            include: [{
                model: StudentCourse,
                required: false,
                as: 'StudentCourses',
                where: {
                    [StudentCourseKeys.COURSE_ID]: courseId
                }
            }, {
                model: User,
                required: true,
                attributes: ['firstName', 'lastName'],
                where: search ? userSearchWhere(search) : undefined
            }],
            where: {
                [Op.or]: [
                    { "$StudentCourses.status$": StundetEnrollmentStatus.WITHDRAWN },
                    { "$StudentCourses.studentId$": null }
                ]
            },
            subQuery: false,
            distinct: true,
            offset,
            limit
        })


        res.json({
            rows: students.rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(students.count / limit),
                totalItems: students.count
            }
        } as PaginationResponse<Student>)
    }
)

export { router as getStundetsToEnrollRouter }