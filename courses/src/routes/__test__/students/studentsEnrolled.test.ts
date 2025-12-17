import request from "supertest";
import { Op } from "sequelize";

import { API } from "@rkh-ms/classify-lib/api";
import { StudentQuery, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { TeacherCourse as TeacherCourseAttrs, StudentCourse as StudentCourseAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../../app";
import { Course } from "../../../models/Course";
import { TeacherCourse } from "../../../models/TeacherCourse";
import { Teacher } from "../../../models/Teacher";
import { StudentCourse } from "../../../models/StudentCourse";
import { TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";


const StudentCourseAPIS = API.students_course

/**a function to make call to get all teachers assigned to a course */
const makeRequest = (id: number, authentication?: {
    id?: string,
    role?: UserRole
}) =>
    request(app)
        .get(StudentCourseAPIS.getCourseStudents(id))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin());


it('Return error after trying to get students enrolled, but not logged in', async () => {
    await request(app)
        .get(StudentCourseAPIS.getCourseStudents(10))
        .expect(401)
})



it('Return error after trying to get students enrolled but don\'nt have permission', async () => {
    await request(app)
        .get(StudentCourseAPIS.getCourseStudents(10))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})



it("Return error after try to get all students enrolled to a course, but passed invalid course id", async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual('id')
})


it("Retrun error when try to get students enrolled to the course, but course not exists", async () => {
    await makeRequest(100000).expect(404)
})


it(`Return error when try to get enrolled students for a course as a teacher, 
    but the teacher not assigned to the course`, async () => {

    // first get a course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // get teacher that not assigned to the course
    const unAssignedTeacher = await Teacher.findOne({
        where: {
            id: {
                [Op.not]: (await TeacherCourse.findAll({
                    where: {
                        courseId: course!.dataValues.id
                    }
                })).map(tc => tc.dataValues.teacherId)
            }
        }
    })
    expect(unAssignedTeacher).not.toBeNull()

    // make a request as a teacher to get the students enrolled
    // and expect error 403
    const { body } = await makeRequest(course!.dataValues.id, {
        id: unAssignedTeacher!.dataValues.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Return all students enrolled to the course successfully", async () => {

    // fetch some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // make request to get all students enrolled to the course
    const { body } = await makeRequest(course!.dataValues.id)
        .expect(200)

    const enrolledStudents = body as StudentCourseAttrs & {
        Student: StudentQuery
    }[]

    // fetch enrolled students to the course from the DB
    const enrolledStudentsDB = await StudentCourse.findAll({
        where: {
            courseId: course!.dataValues.id
        }
    })


    expect(enrolledStudents.length).toEqual(enrolledStudentsDB.length)
    expect(enrolledStudents.map(es => es.Student.id).sort((a, b) => a.localeCompare(b)))
        .toEqual(enrolledStudentsDB.map(es => es!.dataValues.studentId).sort((a, b) => a.localeCompare(b)))
})



it("Return all students enrolled to the course successfully, as teacher assigned to the course", async () => {

    // fetch some course
    const teacherCourse = await TeacherCourse.findOne({
        where: {
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacherCourse).not.toBeNull()

    // make request to get all students enrolled to the course
    const { body } = await makeRequest(teacherCourse!.dataValues.courseId, {
        id: teacherCourse!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(200)

    const enrolledStudents = body as StudentCourseAttrs & {
        Student: StudentQuery
    }[]


    // fetch enrolled students to the course from the DB
    const enrolledStudentsDB = await StudentCourse.findAll({
        where: {
            courseId: teacherCourse!.dataValues.courseId
        }
    })


    expect(enrolledStudents.length).toEqual(enrolledStudentsDB.length)
    expect(enrolledStudents.map(es => es.Student.id).sort((a, b) => a.localeCompare(b)))
        .toEqual(enrolledStudentsDB.map(es => es!.dataValues.studentId).sort((a, b) => a.localeCompare(b)))
})