import express, { Request, Response } from 'express'
import 'express-async-errors'
import { Includeable, Op, Order, WhereOptions } from 'sequelize'
import { query } from 'express-validator'

import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { Course as CourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import {
    CourseKeys,
    CourseStatus,
    Sort,
    StudentCourseKeys,
    TeacherCourseKeys
} from '@rkh-ms/classify-lib/enums'

import {
    Actions,
    getPaginationParams,
    PaginationResponse,
    Resources,
    UserRole
} from '@rkh-ms/classify-lib'

import { Course } from '../models/Course'
import { Subject } from '../models/Subject'
import { User } from '../models/User'
import { Teacher } from '../models/Teacher'
import { StudentCourse } from '../models/StudentCourse'
import { TeacherCourse } from '../models/TeacherCourse'
import { paginationValidator } from '../middlewares/paginationValidator'
import { sortValidation } from '../middlewares/sortValidation'
import { API } from '@rkh-ms/classify-lib/api'



const router = express.Router()

//  This route fetch all course from the DB
//  sort and filter can be applied
//  for student only courses enrolled for will be returned
//  for teacher only courses assigned for will be returned
router.get(API.courses.main,
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.Course),
    paginationValidator(),
    sortValidation(3),
    [
        query('status')
            .optional({ values: 'null' })
            .isIn([CourseStatus.NotStarted, CourseStatus.InProgress, CourseStatus.Completed])
            .withMessage((value, { req }) =>
                req.t('errors', 'INVALID_COURSE_STATUS')),

        query('subjectId')
            .optional({ values: 'null' })
            .isInt({ min: 1 })
            .withMessage((value, { req }) =>
                req.t('errors', 'POSITIVE', { key: 'subjectId' })),

        query('teacherId')
            .optional({ values: 'null' })
            .matches(/^\d{7,9}$/)
            .withMessage((value, { req }) => req.t('errors', 'INVALID_ID', { id: value }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        // 1: sort based on start date
        // 2: sort based on end date
        // 3: sort based on course name
        const sort = Number(req.query.sort) || 1;
        const sortDir = req.query.sortDir as string || Sort.DESC;

        // filter based on course status: active, completed, starting soon
        const status = req.query.status as CourseStatus || undefined

        // only manager can filter based on subject and teacher
        const subjectId = Number(req.query.subjectId) || undefined
        const teacherId = req.query.teacherId

        const { page, limit, offset } = getPaginationParams(req)

        /**include array for the final query
         * 
         * includes subject and teachers passes the course
         */
        const include: Includeable[] = [{
            model: Subject,
            required: false,
        }, {
            // get all teachers of the course
            model: Teacher,
            required: false,
            through: {
                attributes: [],
            },
            include: [{ model: User, required: true, attributes: ['firstName', 'lastName'] }],
        }]

        //  1. create order object, to order the courses based on value based by the client
        let order: Order = []
        switch (sort) {
            // order based on start date
            case 1:
                order = [[CourseKeys.START_DATE, sortDir]]
                break;

            // order based on end date
            case 2:
                order = [[CourseKeys.END_DATE, sortDir]]
                break;

            // order based on course title
            case 3:
                order = [[CourseKeys.TITLE, sortDir]]
                break;
        }

        // 2. create where object to filter the courses based on status.
        let where: WhereOptions<CourseAttrs> = {}
        switch (status) {
            case CourseStatus.NotStarted:
                where = {
                    startDate: {
                        [Op.gt]: new Date()
                    }
                }
                break;

            case CourseStatus.InProgress:
                where = {
                    startDate: {
                        [Op.lte]: new Date()
                    },
                    endDate: {
                        [Op.gte]: new Date()
                    }
                }
                break;

            case CourseStatus.Completed:
                where = {
                    endDate: {
                        [Op.lt]: new Date()
                    }
                }
                break;
        }


        //  3. if subjectId is provided, add it to the where object
        if (subjectId && req.currentUser!.role === UserRole.Manager)
            where = {
                ...where,
                subjectId
            }


        // 4. if teacherId is provided, and the user is manager, add it to the where object
        // if the user is teacher, only show his/her courses
        if ((teacherId && req.currentUser!.role === UserRole.Manager) || req.currentUser!.role === UserRole.Teacher)
            // filter the courses based on specific teacher
            include.push({
                model: TeacherCourse,
                required: true,
                attributes: [],
                where: {
                    [TeacherCourseKeys.TEACHER_ID]: req.currentUser!.role === UserRole.Manager ?
                        String(teacherId) : req.currentUser!.id
                },
            })



        // 5. if the user is student, only show courses he/she is enrolled in
        if (req.currentUser!.role === UserRole.Student)
            include.push({
                model: StudentCourse,
                required: true,
                where: {
                    [StudentCourseKeys.STUDENT_ID]: req.currentUser!.id
                }
            })


        try {
            const courses = await Course.findAndCountAll({
                include,
                where,
                order,
                limit,
                offset,
                subQuery: false,
                distinct: true
            })

            console.log(`Courses to be sent: ${courses.rows.length}`);


            // success response
            res.json({
                rows: courses.rows,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(courses.count / limit),
                    totalItems: courses.count
                }
            } as PaginationResponse<Course>)
        } catch (err) {
            console.error('Error fetching courses:', err);
            throw err
        }
    }
)

export { router as getCoursesRouter }