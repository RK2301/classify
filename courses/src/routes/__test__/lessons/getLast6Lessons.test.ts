import request from "supertest";
import { Op } from "sequelize";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { LessonKeys, StundetEnrollmentStatus, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";
import { Lesson as LessonAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../../app";
import { Student } from "../../../models/Student";
import { StudentCourse } from "../../../models/StudentCourse";
import { Course } from "../../../models/Course";
import { Teacher } from "../../../models/Teacher";
import { TeacherCourse } from "../../../models/TeacherCourse";

const LessonAPIS = API.lessons

/**function to make request to get last 6 lesson for a course based on the current date
 * 
 * @param id of the course, that want to get it's last 6 lessons
 */
const makeRequest = (id: number, authentication?: {
    id?: string,
    role?: UserRole
}) => {
    return request(app)
        .get(LessonAPIS.getLast6Lessons(id))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())
}


it('Return error after trying to get lessons and not logged in', async () => {
    await request(app)
        .get(LessonAPIS.getLast6Lessons(4))
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



it("Return error when student try to get last 6 lessons for course that not enrolled for", async () => {

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



it("Return error when teacher try to get last 6 lessons for course that not assigned for", async () => {

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

    // now get all courses that he never assigned for
    const notAssignedCourse = await Course.findOne({
        where: {
            id: {
                [Op.not]: teacherCourses.map(tc => tc.dataValues.courseId)
            }
        }
    })
    expect(notAssignedCourse).not.toBeNull()

    // now make the request as teacher to get last 6 lesson for the course
    // and expect error
    await makeRequest(notAssignedCourse!.dataValues.id, {
        id: teacher!.dataValues.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Return error when try to get last 6 lessons for a course that not exists", async () => {
    await makeRequest(100000).expect(404)
})



it("Return last 6 lessons successfully", async () => {

    // fetch some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // make request to get the last 6 lessons
    const { body } = await makeRequest(course!.dataValues.id)
    const lessons = body as LessonAttrs[]

    expect(lessons.length).toEqual(course!.dataValues.numberOfLessons > 6 ? 6 : course!.dataValues.numberOfLessons)
})



it("Return last 6 lesson for teacher that assigned to the course", async () => {

    // find some teacher assigned to a course
    const courseTeacher = await TeacherCourse.findOne({
        where: {
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(courseTeacher).not.toBeNull()

    // fetch the course data
    const course = await Course.findByPk(courseTeacher!.dataValues.courseId)

    // make request to get the last 6 lessons
    const { body } = await makeRequest(courseTeacher!.dataValues.courseId, {
        id: courseTeacher!.dataValues.teacherId,
        role: UserRole.Teacher
    })
    const lessons = body as LessonAttrs[]

    expect(lessons.length).toEqual(course!.dataValues.numberOfLessons > 6 ? 6 : course!.dataValues.numberOfLessons)
})



it("Return last 6 lesson for student that enrolled to the course", async () => {

    // find some student enrolled for a course
    const courseStudent = await StudentCourse.findOne({
        where: {
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(courseStudent).not.toBeNull()

    // fetch the course data
    const course = await Course.findByPk(courseStudent!.dataValues.courseId)

    // make request to get the last 6 lessons
    const { body } = await makeRequest(courseStudent!.dataValues.courseId, {
        id: courseStudent!.dataValues.studentId,
        role: UserRole.Student
    })
    const lessons = body as LessonAttrs[]

    expect(lessons.length).toEqual(course!.dataValues.numberOfLessons > 6 ? 6 : course!.dataValues.numberOfLessons)
})