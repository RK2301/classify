import express, { Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'

import { Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { AttendanceKeys } from '@rkh-ms/classify-lib/enums'
import { ForbiddenError, NotFoundError } from '@rkh-ms/classify-lib/errors'

import { userIdRegularExpression } from '../utils/userIdRegularExpression'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { StudentCourse } from '../models/StudentCourse'
import { Lesson } from '../models/Lesson'
import { Attendance } from '../models/Attendance'


const router = express.Router()

router.get('/api/courses/:courseId/students/:studentId/attendance',
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Attendance),
    [
        param('courseId')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),
        param('studentId')
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .matches(userIdRegularExpression)
            .withMessage((value, { req }) => req.t('errors', 'NO_STUDENT_WITH_SUCH_ID', { id: value }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const courseId = Number(req.params.courseId)
        const studentId = req.params.studentId as string

        //  1. before teacher can access student report
        //  make sure he assigned to the course
        await isTeacherAssigned(courseId, req)


        //  2. make sure he's enrolled for the course
        const enrolled = await StudentCourse.findOne({
            where: {
                courseId,
                studentId
            }
        })
        if (!enrolled)
            throw new NotFoundError()


        //  3. student can access only it's attendance report
        if (studentId !== req.currentUser!.id && req.currentUser!.role === UserRole.Student)
            throw new ForbiddenError()


        //  4. return student attendance for the course
        const attendance = await Lesson.findAll({
            include: {
                model: Attendance,
                required: false,
                where: {
                    [AttendanceKeys.STUDENT_ID]: studentId
                }
            },
            where: {
                course_id: courseId
            }
        })

        res.json(attendance)
    }
)

export { router as studentAttendanceRouter }