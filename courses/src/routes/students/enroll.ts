import express, { Request, Response } from 'express'
import 'express-async-errors'

import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { StudentCourseKeys, StundetEnrollmentStatus } from '@rkh-ms/classify-lib/enums'
import { StudentCourse as StudentCourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'

import { Course } from '../../models/Course'
import { Student } from '../../models/Student'
import { StudentCourse } from '../../models/StudentCourse'
import { enrollWithdrawalValidation } from '../../util/enroll_withdrawal_validation'
import { API } from '@rkh-ms/classify-lib/api'
import { StudentEnrolledPublisher } from '../../rabbit_mq/publishers/StudentEnrolledPublisher'

const router = express.Router()

export type EnrollStudentRequestBody = Pick<StudentCourseAttrs, StudentCourseKeys.COURSE_ID | StudentCourseKeys.STUDENT_ID>

/**This route handle request to enroll student to a course */
router.post(`${API.students_course.main}/enroll`,
    accessControlMiddleware(Actions.createAny, Resources.StudentCourse),
    enrollWithdrawalValidation(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. read course and studnet ids value
        const { courseId, studentId } = req.body as EnrollStudentRequestBody

        // 2. check if course exists
        const coursePromise = Course.findByPk(courseId)

        // 3. check if student exists
        const studentPromise = Student.findByPk(studentId)

        const [course, student] = await Promise.all([coursePromise, studentPromise])
        if (!course)
            throw new NotFoundError(req.t('errors', 'COURSE_NOT_FOUND'))

        if (!student)
            throw new NotFoundError(req.t('errors', 'STUDNET_NOT_FOUND'))

        // 4. check if student already enrolled for the course
        const isEnrolled = await StudentCourse.findOne({
            where: {
                courseId,
                studentId
            }
        })

        let enrollment: StudentCourse
        let message: string

        // 5. if not enrolled previously then enroll
        if (!isEnrolled) {
            enrollment = await StudentCourse.create({
                studentId,
                courseId,
                enrolled_at: new Date().toISOString()
            })
            message = req.t('success', 'STUDENT_ENROLLED_SUCCESSFULLY')

            // emit event indicating student enrolled
            new StudentEnrolledPublisher(rabbitMQ_Wrapper.channel).publish(enrollment.dataValues)

        } else {

            enrollment = isEnrolled
            const active = isEnrolled.dataValues.status === StundetEnrollmentStatus.ACTIVE

            /**if student already enrolled and withdrawel, then make it active again */
            if (!active) {
                await enrollment.update({
                    [StudentCourseKeys.STATUS]: StundetEnrollmentStatus.ACTIVE,
                    [StudentCourseKeys.WITHDRAWAL_DATE]: null as unknown as undefined
                })

                // emit event indicating student enrolled
                new StudentEnrolledPublisher(rabbitMQ_Wrapper.channel).publish(enrollment.dataValues)
            }

            /**if student enrolled then tell that already enrolled
             * 
             * if was previously withdrawl, then sent success message says that student enrolled
             */
            message = active ? req.t('success', 'STUNDET_ALREADY_ENROLLED') : req.t('success', 'STUDENT_ENROLLED_SUCCESSFULLY')
        }

        res.status(201).json({
            enrollment,
            message
        })
    }
)

export { router as enrollStudentRouter }