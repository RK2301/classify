import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'
import { body } from 'express-validator'

import { Actions, rabbitMQ_Wrapper, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { CourseKeys } from '@rkh-ms/classify-lib/enums'
import { BadRequestError } from '@rkh-ms/classify-lib/errors'
import { Course as CourseAttrs } from '@rkh-ms/classify-lib/interfaces'
import { checkSubjectExsiting } from '../middlewares/checkSubjectExisting'
import { checkTeacherExisting } from '../middlewares/checkTeachersExisting'
import { createLessons } from '../util/createLessons'
import { Course } from '../models/Course'
import { sequelize } from '../connect'
import { TeacherCourse } from '../models/TeacherCourse'
import { Lesson } from '../models/Lesson'
import { CourseCreatedPublisher } from '../rabbit_mq/publishers/CourseCreatedPublisher'
import { TimeFormatRegExp } from '../util/timeFormatRegExp'

import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)

const router = express.Router()

/**Type describe the body request for adding a course */
export type AddCourseRequestBody = Pick<CourseAttrs,
    CourseKeys.TITLE | CourseKeys.SUBJECT_ID | CourseKeys.START_DATE | CourseKeys.NUMBER_OF_LESSONS>
    & {
        lessons: {
            day: number;
            startTime: string;
            endTime: string
        }[],
        teachers: string[]
    }

router.post('/api/courses',
    accessControlMiddleware(Actions.createAny, Resources.Course),
    [
        body(CourseKeys.TITLE)
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED')),
        body(CourseKeys.SUBJECT_ID)
            .isInt({ min: 0 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),

        body(CourseKeys.START_DATE)
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isISO8601()
            .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE')),
        body(CourseKeys.NUMBER_OF_LESSONS)
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),

        body('teachers')
            .not()
            .isEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isArray({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'PROVIDE_ARRAY'))
            .custom((value: any[], { req }) => {

                // check if every value in the array is string of number
                const invalid_id = value?.find(v => typeof v !== 'string' || !/^[0-9]{7,9}$/.test(v))
                if (invalid_id)
                    throw new Error(req.t('errors', 'INVALID_ID', { id: invalid_id }))

                return true;
            }),

        body('lessons')
            .not()
            .isEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isArray({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'PROVIDE_ARRAY')),

        body('lessons.*.day')
            .isInt({ min: 0, max: 6 })
            .withMessage((value, { req }) => req.t('errors', 'BETWEEN', {
                key: 'day',
                min: 0,
                max: 6
            })),

        body('lessons.*.endTime')
            .matches(TimeFormatRegExp)
            .withMessage((value, { req }) => req.t('errors', 'INVALID_TIME_FORMAT')),

        body('lessons.*.startTime')
            .matches(TimeFormatRegExp)
            .withMessage((value, { req }) => req.t('errors', 'INVALID_TIME_FORMAT')),
    ],
    validateRequest,

    /**middleware to check if lessons times collide with each other */
    async (req: Request, res: Response, next: NextFunction) => {

        const lessons = (req.body as AddCourseRequestBody).lessons
        const byDayLessons: Record<number, AddCourseRequestBody['lessons']> = {}

        for (const lesson of lessons) {
            // if there already lessons then checks if they collide
            if (byDayLessons[lesson.day]) {
                // find if there is a lesson in the given day collide with the lesson we try to add
                const lessonStartTime = lesson.startTime
                const lessonEndTime = lesson.endTime

                const lessonStart = dayjs().hour(Number(lessonStartTime.split(':')[0]))
                    .minute(Number(lessonStartTime.split(':')[1]))

                const lessonEnd = dayjs().hour(Number(lessonEndTime.split(':')[0]))
                    .minute(Number(lessonEndTime.split(':')[1]))

                // loop over lessons exists right now for the given day 
                // and check if they collide with the one to be added
                const collideLesson = byDayLessons[lesson.day].find(existingLesson => {
                    const existingStartTime = existingLesson.startTime
                    const existingEndTime = existingLesson.endTime

                    const existingStart = dayjs().hour(Number(existingStartTime.split(':')[0]))
                        .minute(Number(existingStartTime.split(':')[1]))
                    const existingEnd = dayjs().hour(Number(existingEndTime.split(':')[0]))
                        .minute(Number(existingEndTime.split(':')[1]))

                    // check for collision between the 2 lessons
                    return lessonStart.isBetween(existingStart, existingEnd) || lessonEnd.isBetween(existingStart, existingEnd, null, '(]')
                })

                // if not collide found then add the lesson to day list
                if (!collideLesson)
                    byDayLessons[lesson.day].push(lesson)
                else
                    throw new BadRequestError(req.t('errors', 'LESSONS_COLLISION', {
                        day: new Intl.DateTimeFormat(req.locale, {
                            weekday: 'long'
                        })
                            .format(dayjs().day(lesson.day).toDate()),
                        start1: lesson.startTime,
                        end1: lesson.endTime,
                        start2: collideLesson.startTime,
                        end2: collideLesson.endTime
                    }))

            }
            // still no lesson for the given day, so add it to the list
            else
                byDayLessons[lesson.day] = [lesson]
        }

        next()
    },
    checkSubjectExsiting,
    checkTeacherExisting,
    async (req: Request, res: Response) => {

        const body = req.body as AddCourseRequestBody
        const {
            title,
            lessons,
            numberOfLessons,
            startDate,
            subjectId,
            teachers
        } = body

        // 1. create lessons
        const createdLessons = createLessons(
            startDate,
            numberOfLessons,
            lessons
        )


        // 2. retrieve the end date of the course based on the time of 
        // the last lesson
        const endDate = createdLessons[createdLessons.length - 1]?.endTime.toISOString()

        // 3. add course id to all of the created lessons
        const transaction = await sequelize.transaction()
        try {

            const newCourse = await Course.create({
                title,
                startDate,
                endDate,
                subjectId,
                numberOfLessons: createdLessons.length
            }, { transaction })

            // assign teachers to the course
            await TeacherCourse.bulkCreate(teachers.map(id => ({
                teacherId: id,
                courseId: newCourse.dataValues.id,
                assigned_at: dayjs().toISOString()
            })), { transaction })

            // insert the created lessons
            await Lesson.bulkCreate(createdLessons.map(lesson => ({
                ...lesson,
                course_id: newCourse.dataValues.id
            })), { transaction })

            // publish event indicate course created
            new CourseCreatedPublisher(rabbitMQ_Wrapper.channel).publish({
                ...newCourse.dataValues,
                lessons: (await Lesson.findAll({
                    where: {
                        course_id: newCourse.dataValues.id
                    },
                    transaction
                })).map(lesson => lesson.dataValues),

                teachers: (await TeacherCourse.findAll({
                    where: {
                        courseId: newCourse.dataValues.id
                    },
                    transaction
                })).map(t => t.dataValues)
            })

            // commit the transaction and response success
            await transaction.commit()
            res.status(201).json(newCourse)

        } catch (err) {
            console.error(err);
            transaction.rollback()

            throw err
        }
    }
)

export { router as addCourseRouter }