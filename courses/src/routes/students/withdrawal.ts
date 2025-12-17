import express, { Request, Response } from 'express'
import 'express-async-errors'

import { BadRequestError } from '@rkh-ms/classify-lib/errors'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import { StudentCourse as StudentCourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import { StudentCourseKeys, StundetEnrollmentStatus } from '@rkh-ms/classify-lib/enums'

import { StudentCourse } from '../../models/StudentCourse'
import { enrollWithdrawalValidation } from '../../util/enroll_withdrawal_validation'
import { API } from '@rkh-ms/classify-lib/api'
import { StudentWithdrawalPublisher } from '../../rabbit_mq/publishers/StudentWithdrawalPublisher'
import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib'


const router = express.Router()

export type WithdrawalStudentRequestBody = Pick<StudentCourseAttrs, StudentCourseKeys.COURSE_ID | StudentCourseKeys.STUDENT_ID>

router.patch(`${API.students_course.main}/withdrawal`,
    accessControlMiddleware(Actions.updateAny, Resources.StudentCourse),
    enrollWithdrawalValidation(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. read course and studnet ids
        const { courseId, studentId } = (req.body) as WithdrawalStudentRequestBody

        // 2. check if studnet indeed enrolled for the course
        const enrollment = await StudentCourse.findOne({
            where: {
                courseId,
                studentId
            }
        })

        // if student not enrolled for the course throw error
        if (!enrollment)
            throw new BadRequestError(req.t('errors', 'CANNOT_WITHDRAWAL_STUDENT'))

        // 3. check whenever student was withdrawal earlier
        // if so, then no need to make any changes
        if (enrollment.dataValues.status === StundetEnrollmentStatus.ACTIVE) {
            await enrollment.update({
                [StudentCourseKeys.STATUS]: StundetEnrollmentStatus.WITHDRAWN,
                [StudentCourseKeys.WITHDRAWAL_DATE]: new Date().toISOString()
            })

            // emit event indicating student withdrawal
            new StudentWithdrawalPublisher(rabbitMQ_Wrapper.channel).publish(enrollment.dataValues)
        }

        // res successfully update
        res.status(200).json(enrollment)
    }
)


export { router as withdrawalStudnetRouter }