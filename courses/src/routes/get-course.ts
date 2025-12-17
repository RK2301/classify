import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'

import { UserRole } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { ForbiddenError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { StundetEnrollmentStatus, TeacherAssignedStatus } from '@rkh-ms/classify-lib/enums'

import { validateCourseId } from '../util/validateCourseId'
import { Course } from '../models/Course'
import { StudentCourse } from '../models/StudentCourse'
import { TeacherCourse } from '../models/TeacherCourse'
import { Subject } from '../models/Subject'
import { Teacher } from '../models/Teacher'
import { User } from '../models/User'

const router = express.Router()

router.get('/api/courses/:id',
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Course),
    validateCourseId(),
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {

        // This middleware first check's if requested course exists
        // then check's if student enrolled for the given course
        // and check's if teacher assigned to the course
        const courseId = Number(req.params.id)

        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError()

        // if studnet check's if enrolled
        if (req.currentUser!.role === UserRole.Student) {
            const isStundetEnrolled = await StudentCourse.findOne({
                where: {
                    courseId: courseId,
                    studentId: req.currentUser!.id,
                    status: StundetEnrollmentStatus.ACTIVE
                }
            })

            if (!isStundetEnrolled)
                throw new ForbiddenError()
        }


        // if teacher make the request then check's if assigned
        if (req.currentUser!.role === UserRole.Teacher) {
            const isTeacherAssigned = await TeacherCourse.findOne({
                where: {
                    courseId,
                    teacherId: req.currentUser!.id,
                    status: TeacherAssignedStatus.ASSIGNED
                }
            })

            if (!isTeacherAssigned)
                throw new ForbiddenError()
        }

        // if got here, mean user is manager or has access to the course data
        next()
    },
    async (req: Request, res: Response) => {

        const courseId = Number(req.params.id)

        try {
            // fetch course data and returns
            // include subject data
            // as also teachers who currently pass the course
            const course = await Course.findByPk(courseId, {
                include: [{
                    model: Subject
                },
                {
                    model: Teacher,
                    include: [User],
                    through: {
                        attributes: [],
                        where: {
                            status: TeacherAssignedStatus.ASSIGNED
                        }
                    }
                }],
                subQuery: false
            })

            res.json(course)
        } catch (err) {
            console.error(err);
            throw err
        }
    }
)

export { router as getCourseRouter }