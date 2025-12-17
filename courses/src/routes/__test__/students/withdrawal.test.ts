import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { StudentCourseKeys, StundetEnrollmentStatus, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";

import { app } from "../../../app";
import { Course } from "../../../models/Course";
import { Op } from "sequelize";
import { WithdrawalStudentRequestBody } from "../../students/withdrawal";
import { Student } from "../../../models/Student";
import { StudentCourse } from "../../../models/StudentCourse";

const StudentCourseAPIS = API.students_course


/**a function to make call to unassign a teacher to a course */
const makeRequest = (withdrawal: WithdrawalStudentRequestBody) =>
    request(app)
        .patch(StudentCourseAPIS.withdrawal)
        .set('Cookie', global.signin())
        .send(withdrawal)


it('Return error after trying to withdrawal student and not logged in', async () => {
    request(app)
        .patch(StudentCourseAPIS.withdrawal)
        .send()
        .expect(401)
})


it('Return error after trying to withdrawal a student but don\'nt have permission', async () => {
    request(app)
        .patch(StudentCourseAPIS.withdrawal)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send({})
        .expect(403)
})




it('Return error after trying to withdrawal a student from a course, but pass invalid course id - not number', async () => {

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



it(`Return error after trying to withdrawal a student from a course, but pass invalid student id`, async () => {

    const { body } = await makeRequest({
        courseId: 1,
        studentId: '123456'
    })
        .expect(400)

    const errors = (body.errors as ErrorAttr['errors'])
    expect(errors[0].field).toEqual(StudentCourseKeys.STUDENT_ID)
})



it("Return error after try to withdrawal a student that not enrolled to the course", async () => {

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

    // make request to withdrawal the student from the course and expect error
    await makeRequest({
        studentId: notEnrolledStudent!.dataValues.id,
        courseId: course!.dataValues.id
    })
        .expect(400)
})



it("Withdrawal a student successfully", async () => {

    // first get a student enrolled to a random course
    const studentCourse = await StudentCourse.findOne({
        where: {
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(studentCourse).not.toBeNull()


    // now make request to withdrawal the student
    await makeRequest({
        courseId: studentCourse!.dataValues.courseId,
        studentId: studentCourse!.dataValues.studentId
    })
        .expect(200)

    // reload the student course
    await studentCourse!.reload()


    expect(studentCourse).not.toBeNull()
    expect(studentCourse!.dataValues.status).toEqual(StundetEnrollmentStatus.WITHDRAWN)
    expect(studentCourse!.dataValues.withDrawalDate).toBeDefined()
})