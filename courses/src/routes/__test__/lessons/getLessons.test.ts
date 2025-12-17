import request from "supertest";
import dayjs from "dayjs";

import { app } from "../../../app";
import { API } from "@rkh-ms/classify-lib/api";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { LessonKeys, StundetEnrollmentStatus, TeacherAssignedStatus, UserRole } from "@rkh-ms/classify-lib/enums";
import { Lesson as LessonAttrs } from "@rkh-ms/classify-lib/interfaces";

import { Student } from "../../../models/Student";
import { StudentCourse } from "../../../models/StudentCourse";
import { Course } from "../../../models/Course";
import { col, fn, Op, where } from "sequelize";
import { Teacher } from "../../../models/Teacher";
import { TeacherCourse } from "../../../models/TeacherCourse";
import { Lesson } from "../../../models/Lesson";

const LessonAPIS = API.lessons



/**a function to make call to get some course lessons 
 * 
 * @param id of course that want to get lessons related to him
 * @param queryOptions query parameters to sent with the request.
 * 
 *  month of the lessons time. e.g. 9 means get all lesson that take place at septemper
 *  
 * 
 *  year of lessons. e.g. 2024 means get all lessons that take place at 2024
 * 
 * 
 * @param authentication pass id and role when want to make request as student or teacher
*/
const makeRequest = (id: number
    , authentication?: {
    id?: string,
    role?: UserRole
}) => {

    return request(app)
        .get(LessonAPIS.getLessons(id))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())
}




it('Return error after trying to get course lessons and not logged in', async () => {
    await request(app)
        .get(LessonAPIS.getLessons(4))
        .expect(401)
})



it('Return error when make request to get lessons while pass invalid course id', async () => {

    const { body } = await makeRequest("aa" as unknown as number)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to id
    expect(errors.find(err => err.field === LessonKeys.ID)).toBeDefined()


    const { body: body2 } = await makeRequest(-100).expect(400)
    const errors2 = body2.errors as ErrorAttr['errors']
    expect(errors2.find(err => err.field === LessonKeys.ID)).toBeDefined()
})



it("Return error when try to get lessons for course that not exists", async () => {
    await makeRequest(10000).expect(404)
})



it("Return error when student try to get lessons for course that not enrolled for", async () => {

    // fetch some student
    const student = await Student.findOne()
    expect(student).not.toBeNull()

    // get all courses he enrolled for
    const studentCourses = await StudentCourse.findAll({
        where: {
            studentId: student!.dataValues.id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })

    // now get all courses that he never enrolled for
    const notEnrolledCourse = await Course.findOne({
        where: {
            id: {
                [Op.not]: studentCourses.map(sc => sc.dataValues.courseId)
            }
        }
    })
    expect(notEnrolledCourse).not.toBeNull()


    // now make the request as student to get lesson for the course
    // and expect error
    await makeRequest(notEnrolledCourse!.dataValues.id, {
        id: student!.dataValues.id,
        role: UserRole.Student
    })
        .expect(403)
})



it("Return error when teacher try to get lessons for course that not assigned for", async () => {

    // fetch some teacher
    const teacher = await Teacher.findOne()
    expect(teacher).not.toBeNull()

    // get all courses he assigned for
    const teacherCourses = await TeacherCourse.findAll({
        where: {
            teacherId: teacher!.dataValues.id,
            status: TeacherAssignedStatus.ASSIGNED
        }
    })

    // now get all courses that he never enrolled for
    const notAssignedCourse = await Course.findOne({
        where: {
            id: {
                [Op.not]: teacherCourses.map(tc => tc.dataValues.courseId)
            }
        }
    })
    expect(notAssignedCourse).not.toBeNull()

    // now make the request as teacher to get lesson for the course
    // and expect error
    await makeRequest(notAssignedCourse!.dataValues.id, {
        id: teacher!.dataValues.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Get course lessons successfully", async () => {

    // fetch some course
    const course = await Course.findOne({
        where: {
            endDate: {
                [Op.gte]: new Date()
            }
        }
    })
    expect(course).not.toBeNull()


    // make request to get all course lessons
    const { body } = await makeRequest(course!.dataValues.id).expect(200)
    const recLessons = body as LessonAttrs[]

    // fetch course lessons from the DB and check if same number of lessons got in the response
    const lessons = await Lesson.findAll({
        where: {
            course_id: course!.dataValues.id,
        }
    })

    expect(recLessons.length).toEqual(lessons.length)
})



it("Get lessons successfully as a student, to course that enrolled for", async () => {

    // fetch some course that still not ended
    const course = await Course.findOne({
        where: {
            endDate: {
                [Op.gte]: new Date()
            }
        }
    })
    expect(course).not.toBeNull()

    // get some student enrolled for the course
    const student = await StudentCourse.findOne({
        where: {
            courseId: course!.dataValues.id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()


    // make request to get all course lessons
    const { body } = await makeRequest(course!.dataValues.id, {
        id: student!.dataValues.studentId,
        role: UserRole.Student
    })
        .expect(200)
    const recLessons = body as LessonAttrs[]


    // fetch course lessons from the DB and check if same number of lessons got in the response
    const lessons = await Lesson.findAll({
        where: {
            course_id: course!.dataValues.id,
        }
    })

    expect(recLessons.length).toEqual(lessons.length)
    expect(recLessons.map(l => l.id).sort((a, b) => a - b)).toEqual(
        lessons.map(l => l.dataValues.id).sort((a, b) => a - b)
    )
})



it("Get lessons successfully as a teacher, to course that assigned for", async () => {

    // fetch some course that still not ended
    const course = await Course.findOne({
        where: {
            endDate: {
                [Op.gte]: new Date()
            }
        }
    })
    expect(course).not.toBeNull()

    // get some teacher assigned for the course
    const teacher = await TeacherCourse.findOne({
        where: {
            courseId: course!.dataValues.id,
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacher).not.toBeNull()


    // make request to get all course lessons
    const { body } = await makeRequest(course!.dataValues.id, {
        id: teacher!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(200)
    const recLessons = body as LessonAttrs[]


    // fetch course lessons from the DB and check if same number of lessons got in the response
    const lessons = await Lesson.findAll({
        where: {
            course_id: course!.dataValues.id,
        }
    })

    expect(recLessons.length).toEqual(lessons.length)
    expect(recLessons.map(l => l.id).sort((a, b) => a - b)).toEqual(
        lessons.map(l => l.dataValues.id).sort((a, b) => a - b)
    )
})