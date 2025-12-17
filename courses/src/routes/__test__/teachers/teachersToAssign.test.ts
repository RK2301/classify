import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { PaginationResponse, TeacherQuery, TeacherSpecificAttr, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";

import { app } from "../../../app";
import { Course } from "../../../models/Course";
import { TeacherCourse } from "../../../models/TeacherCourse";
import { TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";

const TeacherCourseAPIS = API.teachers_course

/**a function to make call to get all teachers assigned to a course */
const makeRequest = (id: number, query?: {
    search?: string
}) => {

    const queryString: string = query ? new URLSearchParams(query as any).toString() : ''
    const url = `${TeacherCourseAPIS.getTeachersToAssign(id)}${queryString ? "?" + queryString : ''}`

    return request(app)
        .get(url)
        .set('Cookie', global.signin());
}



it('Return error after trying to get teachers to assign, but not logged in', async () => {
    await request(app)
        .get(TeacherCourseAPIS.getTeachersToAssign(10))
        .expect(401)
})



it('Return error after trying to get teachers to assign but don\'nt have permission', async () => {
    await request(app)
        .get(TeacherCourseAPIS.getTeachersToAssign(10))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})



it("Return error after try to get teachers to assign to a course, but passed invalid course id", async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual('id')
})



it("Get all teachers to assign to the course successfully", async () => {

    // get some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // make request to get all teachers assigned to the course
    const { body } = await makeRequest(course!.dataValues.id)
        .expect(200)

    const teachersToAssign = (body as PaginationResponse<TeacherSpecificAttr>).rows

    // max number of teachers to assign is returned by the server limit to 10
    expect(teachersToAssign.length).toBeLessThan(11)
    // console.log(teachersToAssign);

    // fetch all teachers that assigned to that course
    const teachersAssigned = await TeacherCourse.findAll({
        where: {
            courseId: course!.dataValues.id,
            status: TeacherAssignedStatus.ASSIGNED
        }
    })

    // console.log(teachersAssigned.map(t => t.dataValues));

    // all of id's return to assign shouldn't be as assigned to the course
    const isTeacherAssignedReceivedToAssign = teachersToAssign.map(t => t.id).every(id =>
        !teachersAssigned.find(ta => ta.dataValues.teacherId === id))
    expect(isTeacherAssignedReceivedToAssign).toBeTruthy()
})



it("Search teacher to assign", async () => {

    // get some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    const search = 'a'
    const { body } = await makeRequest(course!.dataValues.id, {
        search
    })
        .expect(200)

    const searchedTeachers = (body as PaginationResponse<Omit<TeacherQuery, 'Subjects'>>).rows

    const searchCorrect = searchedTeachers.map(t => t.User.firstName + ' ' + t.User.lastName)
        .every(name => /a/.test(name))
    expect(searchCorrect).toBeTruthy()
})