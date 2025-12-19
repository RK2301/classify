import request from "supertest";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)
dayjs.extend(utc)

import { app } from "../../../app";

import { API } from "@rkh-ms/classify-lib/api";
import { UpdatedLessonRequestBody } from "../../../types/lessonRequestType";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { LessonKeys, LessonStatus } from "@rkh-ms/classify-lib/enums";
import { Lesson } from "../../../models/Lesson";
import { literal, Op } from "sequelize";
import { Course } from "../../../models/Course";

const LessonAPIS = API.lessons

/**a function to make call to update a lesson */
const makeRequest = (lesson: UpdatedLessonRequestBody & { cancel?: boolean }) =>
    request(app)
        .patch(LessonAPIS.update)
        .set('Cookie', global.signin())
        .send(lesson);



it('Return error after trying to update a lesson and not logged in', async () => {
    await request(app)
        .patch(LessonAPIS.update)
        .send()
        .expect(401)
})


it('Return error after trying to update a lesson but don\'nt have permission', async () => {
    await request(app)
        .patch(LessonAPIS.update)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send()
        .expect(403)
})



it("Return error after pass invalid format of lesson id", async () => {

    const { body } = await makeRequest({
        id: -1,
        startTime: '14:00',
        endTime: '11:00',
        date: '2025-10-01'
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to both start and end time
    expect(errors.find(err => err.field === LessonKeys.ID)).toBeDefined()
})



it("Get error after try to update not exists lesson", async () => {
    await makeRequest({
        id: 10000,
        startTime: '11:00',
        endTime: '14:00',
        date: '2025-10-01'
    })
        .expect(404)
})



it("Return error if try to cancel an completed lesson", async () => {

    // fetch completed lesson
    const completedLesson = await Lesson.findOne({
        where: {
            status: LessonStatus.COMPLETED
        }
    })
    expect(completedLesson).not.toBeNull()

    // make request to cancel the lesson
    await makeRequest({
        id: completedLesson!.dataValues.id,
        cancel: true,
        date: '',
        startTime: '',
        endTime: ''
    })
        .expect(400)
})



it("Cancel lesson successfully", async () => {

    // fetch a lesson that not completed
    const lesson = await Lesson.findOne({
        where: {
            status: {
                [Op.not]: LessonStatus.COMPLETED
            }
        }
    })
    expect(lesson).not.toBeNull()

    // make request to cancel the lesson
    await makeRequest({
        id: lesson!.dataValues.id,
        cancel: true,
        date: '',
        startTime: '',
        endTime: ''
    })
        .expect(200)

    // reload the lesson and check if status set to cancelled
    await lesson?.reload()
    expect(lesson!.dataValues.status).toEqual(LessonStatus.CANCELLED)
})



it("Uncancel a lesson, that cancelled previously", async () => {

    // first get a lesson not completed
    const lesson = await Lesson.findOne({
        where: {
            status: {
                [Op.not]: LessonStatus.COMPLETED
            }
        }
    })
    expect(lesson).not.toBeNull()

    // cancel the lesson
    await lesson!.update({
        status: LessonStatus.CANCELLED
    })

    // now make request to uncancell the lesson
    await makeRequest({
        id: lesson!.dataValues.id,
        cancel: false,
        date: '',
        startTime: '',
        endTime: ''
    })
        .expect(200)

    // reload the lesson and check if status changed
    await lesson!.reload()
    expect(lesson!.dataValues.status).not.toEqual(LessonStatus.CANCELLED)
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)
})



it("Return error when make request to update lesson with invalid times for the lesson", async () => {

    const { body } = await makeRequest({
        id: 1,
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



it('Return error when make request to update lesson while end time is before the start time', async () => {

    const { body } = await makeRequest({
        id: 1,
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
        id: 1,
        startTime: '14:00',
        endTime: '15:00',
        date: '2025-10-aa'
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to both start and end time
    expect(errors.find(err => err.field === 'date')).toBeDefined()
})



it("Return error while trying to update on going lesson", async () => {

    const ongoingLesson = await Lesson.findOne({
        where: {
            status: LessonStatus.ONGOING
        }
    })
    expect(ongoingLesson).not.toBeNull()

    // make request to update the lesson
    await makeRequest({
        id: ongoingLesson!.dataValues.id,
        date: '2025-10-01',
        startTime: '10:00',
        endTime: '11:00'
    })
        .expect(400)
})



it('Return error when try to update lesson while it\'s start before the actual course start', async () => {

    // fetch some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // calculate new start date, that before the course start
    const newStartDate = dayjs(course!.dataValues.startDate).subtract(1, 'day').format('YYYY-MM-DD')

    // get some lesson id related to the course
    const lesson = await Lesson.findOne({
        where: {
            course_id: course!.dataValues.id
        }
    })
    expect(lesson).not.toBeNull()

    // make request to add new lesson
    await makeRequest({
        id: lesson!.dataValues.id,
        startTime: '10:00',
        endTime: '13:00',
        date: newStartDate
    })
        .expect(400)
})



it("Return error when new lesson time collide with other lesson related to the course", async () => {

    // first get a course that have at least 2 lessons
    const course = await Lesson.findOne({
        attributes: [LessonKeys.COURSE_ID],
        group: LessonKeys.COURSE_ID,
        having: literal(`COUNT(${LessonKeys.COURSE_ID})>1`),
        where: {
            status: {
                [Op.not]: LessonStatus.ONGOING
            }
        }
    })
    expect(course).not.toBeNull()

    const courseId = course!.dataValues.course_id

    // now get 2 lessons from the courses lessons
    const lessons = await Lesson.findAll({
        where: {
            course_id: courseId
        }
    })
    expect(lessons.length).toBeGreaterThan(1)

    const lesson1 = lessons[0].dataValues
    const lesson2 = lessons[1].dataValues
    
    // times must be converted to Asia/Jerusalem timezone
    // as later hour:minutes will be consider by the route handler as Asia/Jerusalem times
    const lesson2StartTime = dayjs(lesson2!.startTime).tz('Asia/Jerusalem')

    // set lessons 1 times to collide with lesson 2
    // then make request to update lesson 1
    await makeRequest({
        id: lesson1.id,
        date: dayjs(lesson2StartTime).format('YYYY-MM-DD'),
        startTime: dayjs(lesson2StartTime).add(1, 'minute').format('HH:mm'),
        endTime: dayjs(lesson2!.endTime).tz('Asia/Jerusalem').format('HH:mm')
    })
        .expect(400)
})



it("Update lesson successfully", async () => {

    // first get some lesson
    const lesson = await Lesson.findOne()
    expect(lesson).not.toBeNull()


    // change lesson start time
    // time format will be consider in route handler as Asia/Jerusalem
    // so it's important to convert to that timezone as tests may 
    // run on server not in that timezone
    const newStartTime = dayjs(lesson!.dataValues.startTime).tz('Asia/Jerusalem')
    .add(5, 'minute').format('HH:mm')

    // make request to update the lesson
    await makeRequest({
        id: lesson!.dataValues.id,
        startTime: newStartTime,
        endTime: dayjs(lesson!.dataValues.endTime).tz('Asia/Jerusalem').format('HH:mm'),
        date: dayjs(lesson!.dataValues.startTime).tz('Asia/Jerusalem').format('YYYY-MM-DD')
    })
        .expect(200)

    // reload the lesson and check if the time changed
    await lesson?.reload()

    expect(dayjs(lesson!.dataValues.startTime).format('HH:mm')).toEqual(newStartTime)
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)
})