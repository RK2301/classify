import request from "supertest";
import { app } from "../../app";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { API } from "@rkh-ms/classify-lib/api";
import { AddCourseRequestBody } from "../add";
import { CourseKeys } from "@rkh-ms/classify-lib/enums";
import { Subject } from "../../models/Subject";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { Teacher } from "../../models/Teacher";
import { Course } from "@rkh-ms/classify-lib/interfaces";
import { Course as CourseModel } from "../../models/Course";
import { Lesson } from "../../models/Lesson";
import { TeacherCourse } from "../../models/TeacherCourse";

const CourseAPIS = API.courses

/**a function to make call to add a new course */
const makeRequest = (course: AddCourseRequestBody) =>
    request(app)
        .post(CourseAPIS.add)
        .set('Cookie', global.signin())
        .send(course)


it('Return error after trying to add a course and not logged in', async () => {
    await request(app)
        .post(CourseAPIS.add)
        .send()
        .expect(401)
})


it('Return error after trying to add a course but don\'nt have permission', async () => {
    await request(app)
        .post(CourseAPIS.add)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send({})
        .expect(403)
})



it('Return error after trying to add course be not all course needed values passed', async () => {
    const body: Pick<AddCourseRequestBody, CourseKeys.TITLE> = {
        title: 'A Course'
    }

    await request(app)
        .post(CourseAPIS.add)
        .set('Cookie', global.signin())
        .send(body)
        .expect(400)

})


it('Return error after trying to add a course with lessons that collide', async () => {

    const { body } = await makeRequest({
        title: 'A Course',
        numberOfLessons: 3,
        subjectId: (await Subject.findOne({}))!.dataValues.id,
        startDate: '2025-09-20',
        lessons: [{
            day: 0,
            startTime: '10:00',
            endTime: '14:00'
        }, {
            day: 0,
            startTime: '11:00',
            endTime: '12:00'
        }],
        teachers: ['123456789']
    })
        .expect(400)

    const errorMessage = (body.errors as ErrorAttr['errors'])[0]

    expect(errorMessage).toBeDefined()
    expect(errorMessage.message.includes('11:00')).toBeTruthy()
})


it('Return error when try to add course with subject that not exists', async () => {

    const { body } = await makeRequest({
        title: 'Course',
        startDate: '2025-10-09',
        numberOfLessons: 3,
        subjectId: 100000,
        lessons: [{ day: 0, startTime: '10:00', endTime: '12:00' }],
        teachers: [(await Teacher.findOne())!.dataValues!.id]
    })
        .expect(400)

    const field = (body.errors as ErrorAttr['errors'])[0].field

    expect(field).toBeDefined()
    expect(field).toEqual(CourseKeys.SUBJECT_ID)

})


it('Return error when try to add teacher that not exists', async () => {

    const { body } = await makeRequest({
        title: 'Course',
        startDate: '2025-10-09',
        numberOfLessons: 3,
        subjectId: (await Subject.findOne())!.dataValues.id,
        lessons: [{ day: 0, startTime: '10:00', endTime: '12:00' }],
        teachers: ['000000000']
    })
        .expect(400)


    const errorMessage = (body.errors as ErrorAttr['errors'])[0].message
    expect(errorMessage).toBeDefined()
})


it('Add course successfully', async () => {

    const teacher = await Teacher.findOne()

    const { body } = await makeRequest({
        title: 'New Course',
        startDate: '2025-10-09',
        numberOfLessons: 3,
        subjectId: (await Subject.findOne())!.dataValues.id,
        lessons: [{
            day: 0,
            startTime: '10:00',
            endTime: '12:00'
        }, {
            day: 1,
            startTime: '14:00',
            endTime: '16:00'
        }],
        teachers: [teacher!.dataValues.id]
    })
        .expect(201)

    // check if a course created in the DB
    const courseId = (body as Course).id
    expect(courseId).toBeDefined()


    const course = await CourseModel.findByPk(courseId)
    expect(course).toBeDefined()

    // check if lessons created with the required number of lessons
    const courseLessons = await Lesson.findAll({
        where: {
            course_id: courseId
        }
    })
    expect(courseLessons.length).toEqual(3)

    // check  if the teacher assigned to the course correctly
    const teachersAssigned = await TeacherCourse.findAll({
        where: {
            courseId: courseId
        }
    })

    expect(teachersAssigned).toBeDefined()
    expect(teachersAssigned.length).toEqual(1)

    // expect a event emitted to RabbitMQ indicating course created
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)
})