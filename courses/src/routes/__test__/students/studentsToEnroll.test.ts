import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { PaginationResponse, StudentQuery, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";

import { app } from "../../../app";
import { Course } from "../../../models/Course";
import { CourseKeys, StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums";
import { StudentCourse } from "../../../models/StudentCourse";

const StudentCourseAPIS = API.students_course

/**a function to make call to get all students that can be enrolled to a course */
const makeRequest = (id: number, query?: {
    search?: string
}) => {

    const queryString: string = query ? new URLSearchParams(query as any).toString() : ''
    const url = `${StudentCourseAPIS.getStudentsToEnroll(id)}${queryString ? "?" + queryString : ''}`

    return request(app)
        .get(url)
        .set('Cookie', global.signin());
}



it('Return error after trying to get students to enroll, but not logged in', async () => {
    await request(app)
        .get(StudentCourseAPIS.getStudentsToEnroll(10))
        .expect(401)
})



it('Return error after trying to get students to enroll but don\'nt have permission', async () => {
    await request(app)
        .get(StudentCourseAPIS.getStudentsToEnroll(10))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})



it("Return error after try to get students to enroll to a course, but passed invalid course id", async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual(CourseKeys.ID)
})



it("Return error when try to get stundets to enroll to a course, but the course not exists", async () => {
    await makeRequest(100000).expect(404)
})



it("Get all teachers assigned to the course successfully", async () => {

    // get some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // make request to get all students to assign to the course
    const { body } = await makeRequest(course!.dataValues.id)
        .expect(200)

    const studentsToEnroll = (body as PaginationResponse<StudentQuery>).rows

    // max number of students to enroll is returned by the server limit to 10
    expect(studentsToEnroll.length).toBeLessThan(11)

    // fetch all students that enrolled to that course
    const studentsEnrolled = await StudentCourse.findAll({
        where: {
            courseId: course!.dataValues.id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })


    // all of id's return to enroll shouldn't be as enrolled to the course
    const isStudentEnrolledReceivedToEnroll = studentsToEnroll.map(s => s.id).every(id =>
        !studentsEnrolled.find(sa => sa.dataValues.studentId === id))
    expect(isStudentEnrolledReceivedToEnroll).toBeTruthy()
})



it("Search students to enroll", async () => {

    // get some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    const search = 'a'
    const { body } = await makeRequest(course!.dataValues.id, {
        search
    })
        .expect(200)

    const searchedStudents = (body as PaginationResponse<StudentQuery>).rows

    const searchCorrect = searchedStudents.map(s => s.User.firstName + ' ' + s.User.lastName)
        .every(name => /a/.test(name))
    expect(searchCorrect).toBeTruthy()
})