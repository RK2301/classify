import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { TeacherCourse as TeacherCourseAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../../app";
import { Course } from "../../../models/Course";
import { TeacherCourse } from "../../../models/TeacherCourse";

const TeacherCourseAPIS = API.teachers_course

/**a function to make call to get all teachers assigned to a course */
const makeRequest = (id: number) =>
    request(app)
        .get(TeacherCourseAPIS.getTeachersCourse(id))
        .set('Cookie', global.signin());


it('Return error after trying to get teachers assigned, but not logged in', async () => {
    await request(app)
        .get(TeacherCourseAPIS.getTeachersCourse(10))
        .expect(401)
})



it('Return error after trying to get teachers assigned but don\'nt have permission', async () => {
    await request(app)
        .get(TeacherCourseAPIS.getTeachersCourse(10))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})



it("Return error after try to get all teacher assigned to a course, but passed invalid course id", async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual('id')
})



it("Return all teachers assigned to the course successfully", async () => {

    // fetch some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // make request to get all teachers assigned to the course
    const { body } = await makeRequest(course!.dataValues.id)
        .expect(200)

    const assignedTeachers = body as TeacherCourseAttrs[]

    // fetch assigned teacher to the course from the DB
    const assignedTeachersDB = await TeacherCourse.findAll({
        where: {
            courseId: course!.dataValues.id
        }
    })

    expect(assignedTeachers.length).toEqual(assignedTeachersDB.length)
    expect(assignedTeachers.map(at => at.teacherId).sort((a, b) => a.localeCompare(b)))
        .toEqual(assignedTeachersDB.map(at => at!.dataValues.teacherId).sort((a, b) => a.localeCompare(b)))
})