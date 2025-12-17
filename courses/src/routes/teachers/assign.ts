import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import 'express-async-errors'

import { API } from '@rkh-ms/classify-lib/api'
import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { TeacherAssignedStatus, TeacherCourseKeys } from '@rkh-ms/classify-lib/enums'
import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { TeacherCourse as TeacherCourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'

import { Course } from '../../models/Course'
import { Teacher } from '../../models/Teacher'
import { TeacherCourse } from '../../models/TeacherCourse'
import { TeacherAssignedPublisher } from '../../rabbit_mq/publishers/TeacherAssignedPublisher'

const router = express.Router()

export type AssignTeacherRequestBody = Pick<TeacherCourseAttrs, TeacherCourseKeys.COURSE_ID> & {
    teacher: string
}

router.post(API.teachers_course.main,
    accessControlMiddleware(Actions.createAny, Resources.TeacherCourse),
    [
        body(TeacherCourseKeys.COURSE_ID)
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),

        body('teacher')
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .matches(/^[0-9]{7,9}$/)
            .withMessage((value, { req }) => req.t('errors', 'NO_TEACHER_WITH_SUCH_ID', { id: value }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. read course id & teachers ids
        const { courseId, teacher } = req.body as AssignTeacherRequestBody

        // 2. make sure the course is exists
        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError(req.t('errors', 'CANNOT_ASSIGN_TEACHER'))

        // 3. make sure the teacher exists
        const exists_teacher = await Teacher.findOne({
            where: {
                id: teacher
            }
        })

        // check for teacher not exists
        if (!exists_teacher)
            throw new BadRequestError(req.t('errors', 'NO_TEACHER_WITH_SUCH_ID', { id: teacher }))


        // 4. check if the teacher to be assigned has previusly assgined
        // and now it's status is unassigned
        let teacherCourse = await TeacherCourse.findOne({
            where: {
                courseId,
                teacherId: teacher
            }
        })

        // 5. check if the teacher need to be
        // assigned or re-assign (means was unassign)
        const re_assign = teacherCourse?.dataValues.status === TeacherAssignedStatus.UN_ASSIGNED


        // 6. assign or re-assigned the teacher
        if (!re_assign) {
            const assigned = await TeacherCourse.create({
                teacherId: teacher,
                courseId,
                assigned_at: new Date().toISOString()
            })

            // emit event indicating teacher assigned
            new TeacherAssignedPublisher(rabbitMQ_Wrapper.channel).publish(assigned.dataValues)

        } else {

            // reassign the teachers who has been un_assigned previosly
            await teacherCourse.update({
                status: TeacherAssignedStatus.ASSIGNED,
                unAssigned_at: null as unknown as undefined
            })

            // emit event indicating teacher assigned
            new TeacherAssignedPublisher(rabbitMQ_Wrapper.channel).publish(teacherCourse.dataValues)
        }

        res.status(201).send()
    }
)


export { router as assignTeacherRouter }