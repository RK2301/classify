import request from "supertest";
import { Op } from "sequelize";

import { API } from "@rkh-ms/classify-lib/api";
import { UserAttributes, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { AttendanceKeys, AttendanceStatus, LessonStatus, StudentCourseKeys, StundetEnrollmentStatus, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";
import { Attendance as AttendanceAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../app";
import { Lesson } from "../../models/Lesson";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import dayjs from "dayjs";
import { Attendance } from "../../models/Attendance";
import { StudentCourse } from "../../models/StudentCourse";


const AttendanceAPIS = API.attendance

/**a function to make call to get lesson attendance */
const makeRequest = (lessonId: number, authentication?: {
    id?: string,
    role?: UserRole
}) =>
    request(app)
        .get(AttendanceAPIS.getAttendance(lessonId))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())



it('Return error after trying to get lesson attendance and not logged in', async () => {
    await request(app)
        .get(AttendanceAPIS.getAttendance(2))
        .expect(401)
})


it('Return error after trying to get lesson attendance but don\'nt have permission', async () => {
    await request(app)
        .get(AttendanceAPIS.getAttendance(2))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})



it("Return error after pass invalid format of lesson id", async () => {

    const { body } = await makeRequest(-1)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === AttendanceKeys.LESSON_ID)).toBeDefined()
})



it("Get error after try to get lesson attendance for a not exists lesson", async () => {
    await makeRequest(1000)
        .expect(404)
})



it("Return error after try to get lesson attendance as teacher, but not assigned to the course", async () => {

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

    //  fetch some lesson related to the course
    const lesson = await Lesson.findOne({
        where: {
            course_id: course.id
        }
    })
    expect(lesson).not.toBeNull()

    // make request to get lesson attendnace as unassigend teacher
    await makeRequest(lesson!.dataValues.id, {
        id: notAssigned!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Return error when try to get lesson attendance for lesson not yet started", async () => {

    //  fetch some lesson that scheduled
    const lesson = await Lesson.findOne({
        where: {
            status: LessonStatus.SCHEDULED
        }
    })
    expect(lesson).not.toBeNull()


    // make request to get lesson attendance report
    await makeRequest(lesson!.dataValues.id)
        .expect(400)
})



it("Get lesson attendance successfully", async () => {

    //  first get a lesson that completed or ongoing
    const lesson = await Lesson.findOne({
        where: {
            status: {
                [Op.or]: [LessonStatus.COMPLETED, LessonStatus.ONGOING]
            }
        }
    })
    expect(lesson).not.toBeNull()

    // get all students enrolled for the course including those withdrawal
    const stundetsCourse = await StudentCourse.findAll({ where: { courseId: lesson!.dataValues.course_id } })

    //  make request to report attendance
    const { body } = await makeRequest(lesson!.dataValues.id)
        .expect(200)

    const attendance = body as Pick<UserAttributes, 'firstName' | 'lastName'> & {
        Attendances: AttendanceAttrs
    }[]

    // expect that students enrolled for the course to be in the response
    // students that withdrawal before the lesson start, then must not shown in the response
    const withdrawalStudents = await StudentCourse.findAll({
        where: {
            withDrawalDate: {
                [Op.lt]: lesson!.dataValues.startTime
            }
        }
    })

    const noWithdrawalStudents = attendance.every(att => !withdrawalStudents.find(ws => ws.dataValues.studentId === att.Attendances.studentId))
    expect(noWithdrawalStudents).toBeTruthy()

    // number of students to inculde their attendance
    // is number of overall student enrolled for the course
    // minus those withdrawal before this lesson start
    expect(attendance.length).toEqual(stundetsCourse.length - withdrawalStudents.length)
})



it("Get lesson attendance successfully as a teacher assigned to the course", async () => {

    //  first get a lesson that completed or ongoing
    const lesson = await Lesson.findOne({
        where: {
            status: {
                [Op.or]: [LessonStatus.COMPLETED, LessonStatus.ONGOING]
            }
        }
    })
    expect(lesson).not.toBeNull()

    // get all students enrolled for the course including those withdrawal
    const stundetsCourse = await StudentCourse.findAll({
        where: {
            courseId: lesson!.dataValues.course_id
        }
    })

    // get some teacher enrolled for the course
    const teacher = await TeacherCourse.findOne({
        where: {
            courseId: lesson!.dataValues.course_id,
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacher).not.toBeNull()

    //  make request to report attendance
    const { body } = await makeRequest(lesson!.dataValues.id, {
        id: teacher!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(200)

    const attendance = body as Pick<UserAttributes, 'firstName' | 'lastName'> & {
        Attendances: AttendanceAttrs[]
    }[]

    // expect that students enrolled for the course to be in the response
    // students that withdrawal before the lesson start, then must not shown in the response
    const withdrawalStudents = await StudentCourse.findAll({
        where: {
            withDrawalDate: {
                [Op.lt]: lesson!.dataValues.startTime
            }
        }
    })

    const noWithdrawalStudents = attendance.every(att => !withdrawalStudents.find(ws => ws.dataValues.studentId === att.Attendances[0].studentId))
    expect(noWithdrawalStudents).toBeTruthy()

    // number of students to inculde their attendance
    // is number of overall student enrolled for the course
    // minus those withdrawal before this lesson start
    expect(attendance.length).toEqual(stundetsCourse.length - withdrawalStudents.length)
})



it("Student that withdrawal before lesson won't appear in lesson attendance report", async () => {

    //  first get a lesson that completed
    const lesson = await Lesson.findOne({
        where: {
            status: LessonStatus.COMPLETED
        }
    })
    expect(lesson).not.toBeNull()


    //  get student enrolled for the course and withdrawal it
    const student = await StudentCourse.findOne({
        where: {
            courseId: lesson!.dataValues.course_id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()

    // set withdrawal date before lesson start time
    await student?.update({
        [StudentCourseKeys.STATUS]: StundetEnrollmentStatus.WITHDRAWN,
        [StudentCourseKeys.WITHDRAWAL_DATE]: dayjs(lesson!.dataValues.startTime).subtract(1, 'month').format('YYYY-MM-DD')
    })

    // get another student enrolled for the course and report attendance for him
    const enrolledStudent = await StudentCourse.findOne({
        where: {
            courseId: lesson!.dataValues.course_id,
            status: StundetEnrollmentStatus.ACTIVE,
            studentId: {
                [Op.not]: student!.dataValues.studentId
            }
        }
    })
    expect(enrolledStudent).not.toBeNull()

    // report attedance for the student
    await Attendance.create({
        lessonId: lesson!.dataValues.id,
        studentId: enrolledStudent!.dataValues.studentId,
        status: AttendanceStatus.Late,
        reportedAt: new Date()
    })

    // make request to get lesson attendance report
    const { body } = await makeRequest(lesson!.dataValues.id)
        .expect(200)

    console.log(body);
    const attendance = body as Pick<UserAttributes, 'firstName' | 'lastName'> & {
        Attendances: AttendanceAttrs[]
    }[]

    // expect the withdrawal student not exists in the response
    expect(attendance.find(att => att.Attendances[0]?.studentId === student!.dataValues.studentId)).not.toBeDefined()
})