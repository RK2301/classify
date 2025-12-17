import request from "supertest";
import { Op } from "sequelize";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { StudentCourseKeys, StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums";

import { app } from "../../../app";
import { Course } from "../../../models/Course";
import { EnrollStudentRequestBody } from "../../students/enroll";
import { Student } from "../../../models/Student";
import { StudentCourse } from "../../../models/StudentCourse";

const StudentCourseAPIS = API.students_course

/**a function to make call to assign a teacher to a course */
const makeRequest = (enroll: EnrollStudentRequestBody) =>
    request(app)
        .post(StudentCourseAPIS.enroll)
        .set('Cookie', global.signin())
        .send(enroll)


it('Return error after trying to add a enroll student and not logged in', async () => {
    await request(app)
        .post(StudentCourseAPIS.enroll)
        .send()
        .expect(401)
})


it('Return error after trying to enroll a student but don\'nt have permission', async () => {
    await request(app)
        .post(StudentCourseAPIS.enroll)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send({})
})



it('Return error after trying to enroll a student to a course, but pass invalid course id - not number', async () => {

    const { body } = await makeRequest({
        courseId: 'aa' as unknown as number,
        studentId: '123456689'
    })
        .expect(400)

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual(StudentCourseKeys.COURSE_ID)


    const { body: body2 } = await makeRequest({
        courseId: -10,
        studentId: '123456789'
    })
        .expect(400)

    const errorField2 = (body2.errors as ErrorAttr['errors'])[0].field
    expect(errorField2).toEqual(StudentCourseKeys.COURSE_ID)
})



it(`Return error after trying to enroll a student to course, but pass invalid student id`, async () => {

    const { body } = await makeRequest({
        courseId: 1,
        studentId: '123456'
    })
        .expect(400)

    const errors = (body.errors as ErrorAttr['errors'])
    console.log(errors);

    expect(errors[0].field).toEqual(StudentCourseKeys.STUDENT_ID)
})



it("Return error indicating the course not found", async () => {
    await makeRequest({ courseId: 100000, studentId: '123456789' }).expect(404)
})



it("Return error if student to be enrolled not exists", async () => {

    // first get some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // make a request to enroll a not exists student to the course
    await makeRequest({
        courseId: course!.dataValues.id,
        studentId: '000000000'
    })
        .expect(404)
})



it("Enroll student successfully", async () => {

    // first get a course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // get student that not enrolled to the course
    const notEnrolledStudent = await Student.findOne({
        where: {
            id: {
                [Op.not]: (await StudentCourse.findAll({
                    where: {
                        courseId: course!.dataValues.id
                    }
                })).map(sc => sc.dataValues.studentId)
            }
        }
    })
    expect(notEnrolledStudent).not.toBeNull()

    // now make request to enroll the student
    await makeRequest({
        courseId: course!.dataValues.id,
        studentId: notEnrolledStudent!.dataValues.id
    })
        .expect(201)

    // check if teacher assigned to the course
    const enrolled = await StudentCourse.findOne({
        where: {
            courseId: course!.dataValues.id,
            studentId: notEnrolledStudent!.dataValues.id
        }
    })

    expect(enrolled).not.toBeNull()
    expect(enrolled!.dataValues.status).toEqual(StundetEnrollmentStatus.ACTIVE)
})



it("withdarawal a student then enroll again successfully", async () => {

    // get some stundet enrolled to a course
    const studentCourse = await StudentCourse.findOne({
        where: {
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(studentCourse).not.toBeNull()

    // update the status to withdrawal
    await studentCourse!.update({
        [StudentCourseKeys.STATUS]: StundetEnrollmentStatus.WITHDRAWN
    })


    // now make request to enroll the student again
    await makeRequest({
        courseId: studentCourse!.dataValues.courseId,
        studentId: studentCourse!.dataValues.studentId
    })
        .expect(201)

    // reload the student course data
    await studentCourse!.reload()

    expect(studentCourse!.dataValues.status).toEqual(StundetEnrollmentStatus.ACTIVE)
})