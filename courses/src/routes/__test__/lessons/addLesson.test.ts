import request from "supertest";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)
dayjs.extend(utc)

import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { LessonKeys, Sort } from "@rkh-ms/classify-lib/enums";
import { API } from "@rkh-ms/classify-lib/api";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { Lesson as LessonAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../../app";
import { AddLessonRequestBody } from "../../../types/lessonRequestType";
import { Course } from "../../../models/Course";
import { Lesson } from "../../../models/Lesson";

const LessonAPIS = API.lessons


/**a function to make call to add a new lesson */
const makeRequest = (lesson: AddLessonRequestBody) =>
    request(app)
        .post(LessonAPIS.add)
        .set('Cookie', global.signin())
        .send(lesson);



it('Return error after trying to add a lesson and not logged in', async () => {
    await request(app)
        .post(LessonAPIS.add)
        .send()
        .expect(401)
})


it('Return error after trying to add a lesson but don\'nt have permission', async () => {
    await request(app)
        .post(LessonAPIS.add)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send({})
        .expect(403)
})



it('Return error when make request to add lesson with invalid times for the lesson', async () => {

    const { body } = await makeRequest({
        course_id: 1,
        startTime: 'aa',
        endTime: 'bb',
        date: '2025-10-20'
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to both start and end time
    expect(errors.find(err => err.field === LessonKeys.START_TIME)).toBeDefined()
    expect(errors.find(err => err.field === LessonKeys.END_TIME)).toBeDefined()
})



it('Return error when make request to add lesson while end time is before the start time', async () => {

    const { body } = await makeRequest({
        course_id: 1,
        startTime: '14:00',
        endTime: '11:00',
        date: '2025-10-20'
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to both start and end time
    expect(errors.find(err => err.field === LessonKeys.END_TIME)).toBeDefined()
})



it('Return error when make request to add lesson while pass invalid date', async () => {

    const { body } = await makeRequest({
        course_id: 1,
        startTime: '14:00',
        endTime: '11:00',
        date: '2025-10-aa'
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to both start and end time
    expect(errors.find(err => err.field === 'date')).toBeDefined()
})



it('Return error when make request to add lesson while pass invalid course id', async () => {

    const { body } = await makeRequest({
        course_id: -1,
        startTime: '14:00',
        endTime: '11:00',
        date: '2025-10-01'
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to both start and end time
    expect(errors.find(err => err.field === LessonKeys.COURSE_ID)).toBeDefined()
})



it('Return error when make request to add lesson while pass id for a course not exists', async () => {

    await makeRequest({
        course_id: 10000,
        startTime: '11:00',
        endTime: '14:00',
        date: '2025-10-01'
    })
        .expect(404)
})



it('Return error when try to add lesson while it\'s start before the actual course start', async () => {

    // fetch some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // calculate new start date, that before the course start
    const newStartDate = dayjs(course!.dataValues.startDate).subtract(1, 'day').format('YYYY-MM-DD')


    // make request to add new lesson
    await makeRequest({
        course_id: course!.dataValues.id,
        startTime: '10:00',
        endTime: '13:00',
        date: newStartDate
    })
        .expect(400)
})



it('Return error after try to add lesson that collide with another lesson', async () => {

    // get some lesson
    const lesson = await Lesson.findOne()
    expect(lesson).not.toBeNull()

    /**When pass hour:mintues for add lesson handler
     * the route will consider them as Asia/Jerusalem
     * so times must be converted from the beginning
     * and not depend on server local time when run the tests
     */
    const lessonStartTime = dayjs(lesson?.dataValues!.startTime).tz('Asia/Jerusalem')
    const lessonEndTime = dayjs(lesson?.dataValues!.endTime).tz('Asia/Jerusalem')

    const newDate = lessonStartTime.format('YYYY-MM-DD')

    // now try make request to add new lesson
    // and submit times that collide with the given lesson
    await makeRequest({
        course_id: lesson!.dataValues.course_id,
        date: newDate,
        startTime: lessonStartTime.add(1, 'minute').format('HH:mm'),
        endTime: '23:59'
    })
        .expect(400)


    // now try to set end time, before the actual lesson end time
    await makeRequest({
        course_id: lesson!.dataValues.course_id,
        date: newDate,
        startTime: '00:00',
        endTime: lessonEndTime.subtract(1, 'minute').format('HH:mm')
    })
        .expect(400)


    // now try to set end time, before the actual lesson end time
    // and start time, before the actual lesson start
    await makeRequest({
        course_id: lesson!.dataValues.course_id,
        date: newDate,
        startTime: lessonStartTime.subtract(1, 'minute').format('HH:mm'),
        endTime: lessonEndTime.add(1, 'minute').format('HH:mm')
    })
        .expect(400)
})



it('Add lesson successfully', async () => {

    // add the lesson as the last lesson of the course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    const numberOfLessons = course!.dataValues.numberOfLessons

    // get the last lesson for the returned course
    const lastLesson = await Lesson.findOne({
        where: {
            course_id: course!.dataValues.id
        },
        order: [[LessonKeys.START_TIME, Sort.DESC]]
    })
    expect(lastLesson).not.toBeNull()

    console.log(course?.dataValues);
    console.log(lastLesson?.dataValues);

    // make lesson date, one day after the course end
    const lessonDate = dayjs(lastLesson!.dataValues.startTime).add(1, 'day').format('YYYY-MM-DD')

    // make request to add the lesson
    const { body } = await makeRequest({
        course_id: course!.dataValues.id,
        date: lessonDate,
        startTime: '10:00',
        endTime: '12:00'
    })
        .expect(201)

    const newLesson = body as LessonAttrs

    // fetch the lessons and check if created
    expect(await Lesson.findByPk(newLesson.id)).not.toBeNull()

    // reload the course again and expect the lesson created
    await course?.reload()

    expect(numberOfLessons + 1).toEqual(course!.dataValues.numberOfLessons)
    expect(course!.dataValues.endDate).toEqual(lessonDate)

    // make sure a 2 events published
    // one for update the course, and the second for creating new lesson
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(2)
})