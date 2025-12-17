import request from "supertest";
import { Op } from "sequelize";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { AttendanceKeys, AttendanceStatus, LessonStatus, StudentCourseKeys, StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums";

import { app } from "../../app";
import { Lesson } from "../../models/Lesson";
import { ReportAttendanceRequestBody } from "../report-attendance";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import { StudentCourse } from "../../models/StudentCourse";
import dayjs from "dayjs";
import { Attendance } from "../../models/Attendance";


const AttendanceAPIS = API.attendance

/**a function to make call to report attendance */
const makeRequest = (lessonId: number, studentId: string, attendance: ReportAttendanceRequestBody
    , authentication?: {
        id?: string,
        role?: UserRole
    }) =>
    request(app)
        .put(AttendanceAPIS.reportAttendance(lessonId, studentId))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())
        .send(attendance);



it('Return error after trying to report attendance and not logged in', async () => {
    await request(app)
        .put(AttendanceAPIS.reportAttendance(1, ''))
        .send()
        .expect(401)
})


it('Return error after trying to report attendance but don\'nt have permission', async () => {
    await request(app)
        .put(AttendanceAPIS.reportAttendance(1, '1234'))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send()
        .expect(403)
})



it("Return error after pass invalid format of lesson id", async () => {

    const { body } = await makeRequest(-1, '123', { status: AttendanceStatus.Absent })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === AttendanceKeys.LESSON_ID)).toBeDefined()
})



it("Return error after pass invalid format of student id", async () => {

    const { body } = await makeRequest(10, '123', { status: AttendanceStatus.Absent })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to student id
    expect(errors.find(err => err.field === AttendanceKeys.STUDENT_ID)).toBeDefined()
})



it("Return error after pass invalid format of status", async () => {

    const { body } = await makeRequest(10, '123', { status: 'a' as AttendanceStatus })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to student id
    expect(errors.find(err => err.field === AttendanceKeys.STATUS)).toBeDefined()
})



it("Get error after try to report attendance for a not exists lesson", async () => {
    await makeRequest(1000, '123456789', {
        status: AttendanceStatus.Absent
    })
        .expect(404)
})



it("Return error after try to report attendance as teacher, but not assigned to the course", async () => {

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

    // fetch some student enrolled for the course
    const student = await StudentCourse.findOne({
        where: {
            courseId: course.id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()

    // make request to report attendance as unassigend teacher
    await makeRequest(lesson!.dataValues.id, student!.dataValues.studentId, {
        status: AttendanceStatus.Attend
    }, {
        id: notAssigned!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Return error when try to report attendance for lesson not yet started", async () => {

    //  fetch some lesson that scheduled
    const lesson = await Lesson.findOne({
        where: {
            status: LessonStatus.SCHEDULED
        }
    })
    expect(lesson).not.toBeNull()


    // fetch student that enrolled for the course
    const student = await StudentCourse.findOne({
        where: {
            courseId: lesson!.dataValues.course_id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()

    // make request to report attendance
    await makeRequest(lesson!.dataValues.id, student!.dataValues.studentId, {
        status: AttendanceStatus.Absent
    })
        .expect(400)
})



it("Return error after try to report attendance for student not enrolled for the course", async () => {

    //  first get a course
    const course = sampleCourses[0]

    //  get a student not enrolled to the course
    const notEnrolled = await StudentCourse.findOne({
        where: {
            studentId: {
                [Op.notIn]: (await StudentCourse.findAll({
                    where: {
                        courseId: course.id
                    }
                })).map(sc => sc.dataValues.studentId)
            }
        }
    })
    expect(notEnrolled).not.toBeNull()

    //  fetch some lesson related to the course
    const lesson = await Lesson.findOne({
        where: {
            course_id: course.id
        }
    })
    expect(lesson).not.toBeNull()


    // make request to report attendance as not assigned student
    const { body } = await makeRequest(lesson!.dataValues.id, notEnrolled!.dataValues.studentId, {
        status: AttendanceStatus.Attend
    })
        .expect(400)

    const error = (body.errors as ErrorAttr['errors'])[0].message
    expect(error).toBeDefined()
})



it("Return error when try to report attendance for studnet that withdrawn before the lesson start", async () => {

    //  first get a lesson that completed
    const lesson = await Lesson.findOne({
        where: {
            status: LessonStatus.COMPLETED
        }
    })
    expect(lesson).not.toBeNull()


    //  get stundet enrolled for the course and withdrawal it
    const student = await StudentCourse.findOne({
        where: {
            courseId: lesson!.dataValues.course_id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()

    // set withdrawan date before lesson start time
    await student?.update({
        [StudentCourseKeys.STATUS]: StundetEnrollmentStatus.WITHDRAWN,
        [StudentCourseKeys.WITHDRAWAL_DATE]: dayjs(lesson!.dataValues.startTime).subtract(1, 'month').format('YYYY-MM-DD')
    })

    console.log(student?.dataValues);

    // make request to report attendance and expect error
    const { body } = await makeRequest(lesson!.dataValues.id, student!.dataValues.studentId, {
        status: AttendanceStatus.Attend
    })
        .expect(400)

    const error = (body.errors as ErrorAttr['errors'])[0].message
    expect(error).toBeDefined()
})



it("Report attendance successfully", async () => {

    //  first get a lesson that completed or ongoing
    const lesson = await Lesson.findOne({
        where: {
            status: {
                [Op.or]: [LessonStatus.COMPLETED, LessonStatus.ONGOING]
            }
        }
    })
    expect(lesson).not.toBeNull()

    //  get student that not reported attendance for him
    const student = await StudentCourse.findOne({
        where: {
            courseId: lesson!.dataValues.course_id,
            studentId: {
                [Op.notIn]: (await Attendance.findAll({
                    where: {
                        lessonId: lesson!.dataValues.id
                    }
                })).map(s => s.dataValues.studentId)
            }
        }
    })
    expect(student).not.toBeNull()


    //  make request to report attendance
    await makeRequest(lesson!.dataValues.id, student!.dataValues.studentId, {
        status: AttendanceStatus.Late
    })
        .expect(201)


    // fetch the DB and check if attendance created
    const attendance = await Attendance.findOne({
        where: {
            lessonId: lesson!.dataValues.id,
            studentId: student!.dataValues.studentId
        }
    })

    expect(attendance).not.toBeNull()
    expect(attendance!.dataValues.status).toEqual(AttendanceStatus.Late)
})



it("Update exists attendance successfully", async () => {


    //  fetch exists attedance
    const attendance = await Attendance.findOne()
    expect(attendance).not.toBeNull()

    // change attendance status
    const newStatus = [AttendanceStatus.Absent, AttendanceStatus.Attend, AttendanceStatus.Late]
        .filter(s => s !== attendance!.dataValues.status)[0]

    // make request to update the attendance
    await makeRequest(attendance!.dataValues.lessonId, attendance!.dataValues.studentId, {
        status: newStatus
    })
        .expect(200)

    // reload the attendance
    await attendance!.reload()

    // check if status changed
    expect(attendance!.dataValues.status).toEqual(newStatus)
})