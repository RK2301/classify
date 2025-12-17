import express, { Request, Response } from 'express'
import { body } from 'express-validator'
import 'express-async-errors'

import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import { TeacherCourse as TeacherCourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import { TeacherAssignedStatus, TeacherCourseKeys } from '@rkh-ms/classify-lib/enums'
import { BadRequestError } from '@rkh-ms/classify-lib/errors'

import { TeacherCourse } from '../../models/TeacherCourse'
import { API } from '@rkh-ms/classify-lib/api'
import { TeacherUnassignedPublisher } from '../../rabbit_mq/publishers/TeacherUnassignedPublisher'


export type UnassignRequestBody = Pick<TeacherCourseAttrs, TeacherCourseKeys.COURSE_ID | TeacherCourseKeys.TEACHER_ID>
const router = express.Router()


/**This route handler to unassign a teacher from a course by setting status to unassigned */
router.patch(`${API.teachers_course.main}/unassign`,
    accessControlMiddleware(Actions.updateAny, Resources.TeacherCourse),
    [
        body(TeacherCourseKeys.COURSE_ID)
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),

        body(TeacherCourseKeys.TEACHER_ID)
            .notEmpty()
            .withMessage(((value, { req }) => req.t('errors', 'REQUIRED')))
            .matches(/^[0-9]{7,9}$/)
            .withMessage((value, { req }) => req.t('errors', 'NO_TEACHER_WITH_SUCH_ID', { id: value }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. read values of course id + teacher id
        const { courseId, teacherId } = req.body as UnassignRequestBody


        // 2. check if teacher is assigned to the course
        const isAssigned = await TeacherCourse.findOne({
            where: {
                courseId,
                teacherId
            }
        })

        if (!isAssigned)
            throw new BadRequestError(req.t('errors', 'CANNOT_UNASSIGNED_TEACHER'))

        // update teacher assign status
        isAssigned.set({
            [TeacherCourseKeys.STATUS]: TeacherAssignedStatus.UN_ASSIGNED,
            [TeacherCourseKeys.UNASSIGNED_AT]: new Date().toISOString()
        })
        await isAssigned.save()

        // emit event indicating teacher unassigned
        new TeacherUnassignedPublisher(rabbitMQ_Wrapper.channel).publish(isAssigned.dataValues)

        res.json(isAssigned)
    }
)


export { router as unassignTeacherRouter }