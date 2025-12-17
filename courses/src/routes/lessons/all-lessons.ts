import express, { Request, Response } from 'express'
import 'express-async-errors'
import { query } from 'express-validator'
import dayjs from 'dayjs'

import { Actions, Resources, UserRole } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { API } from '@rkh-ms/classify-lib/api'
import { BadRequestError } from '@rkh-ms/classify-lib/errors'
import { StundetEnrollmentStatus, TeacherAssignedStatus } from '@rkh-ms/classify-lib/enums'
import { Lesson as LessonAttrs } from '@rkh-ms/classify-lib/interfaces'

import { Lesson } from '../../models/Lesson'
import { Op, WhereOptions } from 'sequelize'
import { Course } from '../../models/Course'
import { Teacher } from '../../models/Teacher'
import { User } from '../../models/User'
import { StudentCourse } from '../../models/StudentCourse'
import { TeacherCourse } from '../../models/TeacherCourse'



const router = express.Router()

//  This route about handle request to get all lessons related to the user
//  based on some dates range (start, end)
//  for managers, all lessons within the range will be fetched
//  for teachers | students only lessons for courses they assigned | enrolled 
//  and within the range will be fetched.
router.get(API.lessons.main + '/all/lessons',
    accessControlMiddleware([Actions.readOwn, Actions.readAny], Resources.Lesson),
    [
        query('start')
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isISO8601()
            .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE')),
        query('end')
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isISO8601()
            .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE'))
            .custom((value: string, { req }) => {

                //  check if start date range is after end date range
                //  if yes then response with error
                const start = dayjs(req.query?.start)
                const end = dayjs(req.query!.end)

                if (end.isBefore(start))
                    throw new BadRequestError(req.t('errors', 'INVALID_START_TIME_SHIFT'))

                return true
            })
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        //  first get the start and end dates passed in the request
        const start = req.query!.start as string
        const end = req.query!.end as string

        const where: WhereOptions<LessonAttrs> = {
            startTime: {
                [Op.between]: [start, end]
            }
        }

        //  if current user is student, then fetch lessons only
        //  for courses enrolled for
        if (req.currentUser!.role === UserRole.Student) {
            where.course_id = {
                [Op.in]: (await StudentCourse.findAll({
                    where: {
                        studentId: req.currentUser!.id,
                        status: StundetEnrollmentStatus.ACTIVE
                    }
                }))
                    .map(enroll => enroll.dataValues.courseId)
            }
        }


        //  if current user is teacher, then fetch lessons only
        //  for courses assigned for
        if (req.currentUser!.role === UserRole.Student) {
            where.course_id = {
                [Op.in]: (await TeacherCourse.findAll({
                    where: {
                        teacherId: req.currentUser!.id,
                        status: StundetEnrollmentStatus.ACTIVE
                    }
                }))
                    .map(assign => assign.dataValues.courseId)
            }
        }

        //  fetch all relevant lessons
        const lessons = await Lesson.findAll({
            include: {
                model: Course,
                required: true,
                include: [{
                    model: Teacher,
                    include: [User],
                    through: {
                        attributes: [],
                        where: {
                            status: TeacherAssignedStatus.ASSIGNED
                        }
                    }
                }]
            },
            where
        })

        res.json(lessons)
    }
)

export { router as getAllLessons }