import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'

import { Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { validateCourseId } from '../../util/validateCourseId'
import { ForbiddenError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import { TeacherAssignedStatus } from '@rkh-ms/classify-lib/enums'

import { Course } from '../../models/Course'
import { TeacherCourse } from '../../models/TeacherCourse'
import { StudentCourse } from '../../models/StudentCourse'
import { Student } from '../../models/Student'
import { User } from '../../models/User'
import { API } from '@rkh-ms/classify-lib/api'


const router = express.Router()

/**This route retrieve all students that enrolled or withdrawal for a specific course 
 * if student made the request then must first check if currently assigned to the course
*/
router.get(`${API.students_course.main}/:id`,
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.StudentCourse),
    validateCourseId(),
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {

        // This middleware checks if course exists
        const id = parseInt(req.params.id)

        const course = await Course.findByPk(id)
        if (!course)
            throw new NotFoundError(req.t('errors', 'COURSE_NOT_FOUND'))

        // check if the current client is teacher
        // if yes then check if assigned currently to the course
        if (req.currentUser!.role === UserRole.Teacher) {

            const assigned = await TeacherCourse.findOne({
                where: {
                    courseId: id,
                    teacherId: req.currentUser!.id
                }
            })

            // if teacher not assigned at all
            // or assigned and later unassigned
            // then the teacher not authorized to access student data that enrolled for the course
            if (!assigned || assigned.dataValues.status === TeacherAssignedStatus.UN_ASSIGNED)
                throw new ForbiddenError()
        }

        next()
    },
    async (req: Request, res: Response) => {

        // 1. read course id
        const id = parseInt(req.params.id)

        // 2. fetch students details that enrolled or withdraw from the course
        const students = await StudentCourse.findAll({
            where: {
                courseId: id
            },
            include: {
                model: Student,
                required: true,
                include: [{
                    model: User,
                    attributes: ['firstName', 'lastName'],
                    required: true
                }]
            }
        })

        res.json(students)
    }
)

export { router as getCourseStudentsRouter }