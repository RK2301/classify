import express, { Request, Response } from 'express'
import 'express-async-errors'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { validateRequest, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares'

import { validateCourseId } from '../../util/validateCourseId'
import { TeacherCourse } from '../../models/TeacherCourse'
import { User } from '../../models/User'
import { Teacher } from '../../models/Teacher'
import { API } from '@rkh-ms/classify-lib/api'

const router = express.Router()

/**This route fetch all teachers assigned to specific course, not matter if they where 
 * previously unassigned
 */
router.get(`${API.teachers_course.main}/:id`,
    accessControlMiddleware(Actions.readAny, Resources.TeacherCourse),
    validateCourseId(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. get course id
        const courseId = req.params.id

        // 2. fetch teacher data
        // both assigned and unassigned 
        const teacherCourse = await TeacherCourse.findAll({
            where: {
                courseId
            },
            include: {
                model: Teacher,
                required: true,
                include: [{
                    model: User,
                    required: true,
                    attributes: ['firstName', 'lastName']
                }]
            }
        })

        res.json(teacherCourse)
    }
)

export { router as getCourseTeachers }