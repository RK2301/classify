import express, { Request, Response } from 'express'
import 'express-async-errors'
import { body, param } from 'express-validator'

import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { Actions, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { Attendance as AttendanceAttrs } from '@rkh-ms/classify-lib/interfaces'
import { AttendanceKeys, AttendanceStatus, LessonStatus, StundetEnrollmentStatus } from '@rkh-ms/classify-lib/enums'

import { userIdRegularExpression } from '../utils/userIdRegularExpression'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { Lesson } from '../models/Lesson'
import { StudentCourse } from '../models/StudentCourse'

import utc from 'dayjs/plugin/utc'
import dayjs from 'dayjs'
import { Attendance } from '../models/Attendance'
dayjs.extend(utc)

const router = express.Router()

export type ReportAttendanceRequestBody = Pick<AttendanceAttrs, AttendanceKeys.STATUS>

/**This route handler, handle requests to report student attendance for specific lesson */
router.put('/api/attendance/:lessonId/:studentId',
    accessControlMiddleware([Actions.createAny, Actions.createOwn], Resources.Attendance),
    [
        param('lessonId')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),
        param('studentId')
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .matches(userIdRegularExpression)
            .withMessage((value, { req }) => req.t('errors', 'NO_STUDENT_WITH_SUCH_ID', { id: value })),
        body(AttendanceKeys.STATUS)
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isIn([AttendanceStatus.Absent, AttendanceStatus.Attend, AttendanceStatus.Late])
            .withMessage((value, { req }) => req.t('errors', 'INVALID_ATTENDANCE_STATUS'))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const lessonId = Number(req.params.lessonId)
        const studentId = req.params.studentId as string
        const status = (req.body as ReportAttendanceRequestBody).status

        //  1. check if the lesson exists
        const lesson = await Lesson.findByPk(lessonId)
        if (!lesson)
            throw new NotFoundError()

        //  2. if teacher then check if can access this course (assigned to it)
        await isTeacherAssigned(lesson.dataValues.course_id, req)

        //  3.  if lesson is cancelled or not yet started then 
        // no reporting attendance allowed
        if (lesson.dataValues.status === LessonStatus.CANCELLED)
            throw new BadRequestError(req.t('errors', 'CANNOT_REPORT_ATTENDANCE_CANCELLED_LESSON'))
        if (lesson.dataValues.status === LessonStatus.SCHEDULED)
            throw new BadRequestError(req.t('errors', 'CANNOT_REPORT_ATTENDANCE_SCHEDULED_LESSON'))

        //  4. check if student enrolled for this course
        const enrolled = await StudentCourse.findOne({
            where: {
                courseId: lesson.dataValues.course_id,
                studentId
            }
        })

        // if student not enrolled, or try to take attendance for lesson
        // that start after the student unassigned then throw error
        if (!enrolled || (enrolled.dataValues.status === StundetEnrollmentStatus.WITHDRAWN &&
            dayjs(lesson.dataValues.startTime).isAfter(dayjs.utc(enrolled.dataValues.withDrawalDate).endOf('day'))))
            throw new BadRequestError(req.t('errors', 'CANNOT_REPORT_ATTENDANCE_STUDENT_NOT_ENROLLED'))


        //  5. now check if already reported attendance for the student
        const attendance = await Attendance.findOne({
            where: {
                lessonId,
                studentId
            }
        })

        if (!attendance) {
            const createdAttendance = await Attendance.create({
                studentId,
                lessonId,
                status,
                reportedAt: new Date()
            })

            res.status(201).json(createdAttendance)

        } else {

            attendance.set({
                [AttendanceKeys.STATUS]: status
            })

            // if provided new status then update the reportedAt field
            if (attendance.changed())
                attendance.set({
                    [AttendanceKeys.REPORTED_AT]: new Date()
                })

            await attendance.save()
            res.json(attendance)
        }
    }
)

export { router as reportAttendanceRouter }