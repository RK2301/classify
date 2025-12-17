import express, { Request, Response } from 'express'
import 'express-async-errors'
import { Op } from 'sequelize'
import { param } from 'express-validator'

import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'
import { LessonKeys } from '@rkh-ms/classify-lib/enums'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'

import { CanAccessCourse } from '../../middlewares/canAccessCourse'
import { Course } from '../../models/Course'
import { Lesson } from '../../models/Lesson'
import { API } from '@rkh-ms/classify-lib/api'


const router = express.Router()

router.get(`${API.lessons.main}/last6/:id`,
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Lesson),
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    CanAccessCourse,
    async (req: Request, res: Response) => {

        const courseId = Number(req.params.id)

        //  1. check if course exists
        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError(req.t('errors', 'COURSE_NOT_FOUND'))

        //  2. Get number of lessons that start before this moment (now)
        // and get total number of lessons for the given course
        const lessons = await Lesson.findAll({
            where: {
                course_id: courseId,
                startTime: {
                    [Op.lt]: new Date()
                }
            }
        })

        const numberOfLessons = course.dataValues.numberOfLessons
        const lessonsBeforeNow = lessons.length

        /**Number of lessons that still to be passed */
        const lessonsAfterToday = numberOfLessons - lessonsBeforeNow

        //  3. based on number of lessons before now and total number of lessons
        //  decide what the offset for the query must be
        let offset = 0

        // if number of lessons passed and to be passed 
        // more than 3 then show 3 of passed lessons
        // and 3 of lessons to be passed
        if (lessonsBeforeNow >= 3 && lessonsAfterToday >= 3)
            offset = lessonsBeforeNow - 3

        //  if number of lessons remian less than 3
        //  that's mean the course ended or about to be end
        //  in this case show last 6 lessons or all of them (if course lessons less than 6)
        else if (lessonsAfterToday < 3)
            offset = Math.max(numberOfLessons - 6, 0)


        //  4. fetch the last 6 relevant lessons
        const last6Lessons = await Lesson.findAll({
            where: {
                course_id: courseId
            },
            order: [[LessonKeys.START_TIME, 'ASC']],
            offset,
            limit: 6
        })

        //  5. success response
        res.json(last6Lessons)
    }
)

export { router as getLast6LessonsRouter }