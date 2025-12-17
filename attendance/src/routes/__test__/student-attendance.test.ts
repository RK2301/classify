import request from "supertest";
import { Op } from "sequelize";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { AttendanceKeys, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";
import { Attendance as AttendanceAttrs, Lesson as LessonAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../app";
import { Lesson } from "../../models/Lesson";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import dayjs from "dayjs";
import { Attendance } from "../../models/Attendance";
import { StudentCourse } from "../../models/StudentCourse";
import { User } from "../../models/User";


const AttendanceAPIS = API.attendance

/**a function to make a call to get student attendance report, for a specific course */
const makeRequest = (courseId: number, studentId: string, authentication?: {
    id?: string,
    role?: UserRole
}) =>
    request(app)
        .get(AttendanceAPIS.studentAttendanceReport(courseId, studentId))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())



it('Return error after trying to get student attendance report, but not logged in', async () => {
    await request(app)
        .get(AttendanceAPIS.studentAttendanceReport(1, '211'))
        .expect(401)
})



it("Return error after pass invalid format of course id", async () => {

    const { body } = await makeRequest(-1, '123456789')
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === 'courseId')).toBeDefined()
})



it("Return error after pass invalid format of student id", async () => {

    const { body } = await makeRequest(1, '123456aaa')
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === AttendanceKeys.STUDENT_ID)).toBeDefined()
})



it("Return error after try to get student attendance report as teacher, but not assigned to the course", async () => {

    //  first get a course
    const course = sampleCourses[0]

    //  get a teacher not assigned to the course
    const notAssigned = await TeacherCourse.findOne({
        where: {
            teacherId: {
                [Op.notIn]: (await TeacherCourse.findAll({
                    where: {
                        courseId: course.id
                    }
                })).map(tc => tc.dataValues.teacherId)
            }
        }
    })
    expect(notAssigned).not.toBeNull()

    //  fetch some student enrolled to the course
    const student = await StudentCourse.findOne({
        where: {
            courseId: course.id
        }
    })
    expect(student).not.toBeNull()

    // make request to get student attendnace report as unassigend teacher
    await makeRequest(course.id, student!.dataValues.studentId, {
        id: notAssigned!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Get error after try to get student attendance report, but not enrolled for the course", async () => {
    await makeRequest(1000, '123456789')
        .expect(404)
})



it("Return error when try to get as student a attendance report for another student", async () => {

    // fetch some student enrolled for the course
    const student = await StudentCourse.findOne()
    expect(student).not.toBeNull()

    // fetch another student
    const secondStudent = await User.findOne({
        where: {
            id: {
                [Op.not]: student!.dataValues.studentId
            }
        }
    })
    expect(student).not.toBeNull()

    // now from the second student
    // make a request to get attendance report for the first one
    // and expect an error
    await makeRequest(student!.dataValues.courseId, student!.dataValues.studentId, {
        id: secondStudent!.dataValues.id,
        role: UserRole.Student
    })
        .expect(403)
})



it("Get student attendance report successfully", async () => {

    //  first get a student that enrolled for a course
    const student = await StudentCourse.findOne()
    expect(student).not.toBeNull()

    // get all lessons related to the course
    const lessons = await Lesson.findAll({
        where: {
            course_id: student!.dataValues.courseId
        }
    })
    expect(lessons.length).toBeGreaterThan(0)

    //  make request to get student attendance report
    const { body } = await makeRequest(student!.dataValues.courseId, student!.dataValues.studentId)
        .expect(200)


    const attendance = body as LessonAttrs & {
        Attendances: AttendanceAttrs[]
    }[]

    // expect that for all course lessons, attendance for the student returned
    expect(attendance.length).toEqual(lessons.length)

    // expect attendance returned for the lessons, where a teacher reported attendance for him
    const studentAttendanceDB = await Attendance.findAll({
        where: {
            studentId: student!.dataValues.studentId,
            lessonId: {
                [Op.in]: lessons.map(l => l.dataValues.id)
            }
        }
    })


    /**expect that records where student reported attendace to be in the response */
    expect(
        attendance.filter(att => !!att.Attendances[0])
            .map(att => att.Attendances[0].lessonId)
            .sort((att1, att2) => att1 - att2)
    ).toEqual(
        studentAttendanceDB.map(att => att.dataValues.lessonId)
            .sort((att1, att2) => att1 - att2)
    )
})



it("Get student attendance report successfully, as a student", async () => {

    //  first get a student that enrolled for a course
    const student = await StudentCourse.findOne()
    expect(student).not.toBeNull()

    // get all lessons related to the course
    const lessons = await Lesson.findAll({
        where: {
            course_id: student!.dataValues.courseId
        }
    })
    expect(lessons.length).toBeGreaterThan(0)

    //  make request to get student attendance report
    const { body } = await makeRequest(student!.dataValues.courseId, student!.dataValues.studentId, {
        id: student!.dataValues.studentId,
        role: UserRole.Student
    })
        .expect(200)


    const attendance = body as LessonAttrs & {
        Attendances: AttendanceAttrs[]
    }[]

    // expect that for all course lessons, attendance for the student returned
    expect(attendance.length).toEqual(lessons.length)

    // expect attendance returned for the lessons, where a teacher reported attendance for him
    const studentAttendanceDB = await Attendance.findAll({
        where: {
            studentId: student!.dataValues.studentId,
            lessonId: {
                [Op.in]: lessons.map(l => l.dataValues.id)
            }
        }
    })


    /**expect that records where student reported attendace to be in the response */
    expect(
        attendance.filter(att => !!att.Attendances[0])
            .map(att => att.Attendances[0].lessonId)
            .sort((att1, att2) => att1 - att2)
    ).toEqual(
        studentAttendanceDB.map(att => att.dataValues.lessonId)
            .sort((att1, att2) => att1 - att2)
    )
})



it("Get student attendance report successfully, as a teacher assigned to the course", async () => {

    //  first get a student that enrolled for a course
    const student = await StudentCourse.findOne()
    expect(student).not.toBeNull()

    // get all lessons related to the course
    const lessons = await Lesson.findAll({
        where: {
            course_id: student!.dataValues.courseId
        }
    })
    expect(lessons.length).toBeGreaterThan(0)

    // get a teacher assigned to the course
    const teacher = await TeacherCourse.findOne({
        where: {
            courseId: student!.dataValues.courseId,
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacher).not.toBeNull()

    //  make request as a teacher, to get student attendance report
    const { body } = await makeRequest(student!.dataValues.courseId, student!.dataValues.studentId, {
        id: teacher!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(200)


    const attendance = body as LessonAttrs & {
        Attendances: AttendanceAttrs[]
    }[]

    // expect that for all course lessons, attendance for the student returned
    expect(attendance.length).toEqual(lessons.length)

    // expect attendance returned for the lessons, where a teacher reported attendance for him
    const studentAttendanceDB = await Attendance.findAll({
        where: {
            studentId: student!.dataValues.studentId,
            lessonId: {
                [Op.in]: lessons.map(l => l.dataValues.id)
            }
        }
    })


    /**expect that records where student reported attendace to be in the response */
    expect(
        attendance.filter(att => !!att.Attendances[0])
            .map(att => att.Attendances[0].lessonId)
            .sort((att1, att2) => att1 - att2)
    ).toEqual(
        studentAttendanceDB.map(att => att.dataValues.lessonId)
            .sort((att1, att2) => att1 - att2)
    )
})