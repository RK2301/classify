import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'
import { Op } from 'sequelize'

import { Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { BadRequestError, ForbiddenError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { AttendanceKeys, LessonStatus, StundetEnrollmentStatus } from '@rkh-ms/classify-lib/enums'

import { Lesson } from '../models/Lesson'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { StudentCourse } from '../models/StudentCourse'
import { User } from '../models/User'
import { Attendance } from '../models/Attendance'

const router = express.Router()

/**This router handle request to get attendance for a specific lesson */
router.get('/api/lessons/:lessonId/attendance',
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Attendance),
    /**Student can't access lesson attendance */
    (req: Request, res: Response, next: NextFunction) => {
        if (req.currentUser!.role === UserRole.Student)
            throw new ForbiddenError()

        next()
    },
    [
        param('lessonId')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const lessonId = Number(req.params.lessonId)

        //  1. check if the lesson exists
        const lesson = await Lesson.findByPk(lessonId)
        if (!lesson)
            throw new NotFoundError()

        //  2. check if teacher assigned to the course
        await isTeacherAssigned(lesson.dataValues.course_id, req)

        //  3. no need to return attendane for lesson not yet started or cancelled
        if (lesson.dataValues.status === LessonStatus.CANCELLED ||
            lesson.dataValues.status === LessonStatus.SCHEDULED)
            throw new BadRequestError(req.t('errors', 'CANNOT_GET_ATTENDANCE'))

        //  4. return the attendance for the lesson
        //  students that withdrawal before the lesson start will be filtered
        const attendance = await User.findAll({
            attributes: ['id', 'firstName', 'lastName'],

            include: [{
                model: StudentCourse,
                attributes: [],
                required: true,
                where: {
                    courseId: lesson.dataValues.course_id,
                    [Op.or]: [
                        { status: StundetEnrollmentStatus.ACTIVE },
                        {
                            withDrawalDate: {
                                [Op.gte]: lesson.dataValues.startTime
                            }
                        }
                    ]
                }
            }, {
                model: Attendance,
                required: false,
                where: {
                    [AttendanceKeys.LESSON_ID]: lessonId
                }
            }]
        })

        res.json(attendance)
    }
)

export { router as lessonAttendanceRouter }