import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { TeacherAssignedStatus, TeacherCourseKeys } from "@rkh-ms/classify-lib/enums";

import { app } from "../../../app";
import { AssignTeacherRequestBody } from "../../teachers/assign";
import { Course } from "../../../models/Course";
import { Teacher } from "../../../models/Teacher";
import { Op } from "sequelize";
import { TeacherCourse } from "../../../models/TeacherCourse";

const TeacherCourseAPIS = API.teachers_course


/**a function to make call to assign a teacher to a course */
const makeRequest = (assign: AssignTeacherRequestBody) =>
    request(app)
        .post(TeacherCourseAPIS.assign)
        .set('Cookie', global.signin())
        .send(assign)


it('Return error after trying to add a assign teachers and not logged in', async () => {
    await request(app)
        .post(TeacherCourseAPIS.assign)
        .send()
        .expect(401)
})


it('Return error after trying to assign a teacher but don\'nt have permission', async () => {
    await request(app)
        .post(TeacherCourseAPIS.assign)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send({})
})



it('Return error after trying to assign a teacher to a course, but pass invalid id - not number', async () => {

    const { body } = await makeRequest({
        courseId: 'aa' as unknown as number,
        teacher: ''
    })
        .expect(400)

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual(TeacherCourseKeys.COURSE_ID)


    const { body: body2 } = await makeRequest({
        courseId: -10,
        teacher: '1233asc'
    })
        .expect(400)

    const errorField2 = (body2.errors as ErrorAttr['errors'])[0].field
    expect(errorField2).toEqual(TeacherCourseKeys.COURSE_ID)
})



it('Return error after trying to assign a teacher a course, but pass invalid teacher id', async () => {

    const { body } = await makeRequest({
        courseId: 1,
        teacher: ''
    })
        .expect(400)

    const errors = (body.errors as ErrorAttr['errors'])
    expect(errors.find(err => err.field === 'teacher')).toBeDefined()


    const { body: body2 } = await makeRequest({
        courseId: 10,
        teacher: '122asc'
    })
        .expect(400)

    const errors2 = (body2.errors as ErrorAttr['errors'])
    expect(errors2.find(err => err.field === 'teacher')).toBeDefined()
})



it("Return error indicating the course not found", async () => {
    await makeRequest({ courseId: 100000, teacher: '123456789' }).expect(404)
})



it("Return error if the teacher to be assigned not exists", async () => {

    // first get some course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // make a request to assign a not exists teacher to the course
    await makeRequest({
        courseId: course!.dataValues.id,
        teacher: '000000000'
    })
        .expect(400)
})



it("Assign teacher successfully", async () => {

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

    // now make request to assign the teacher
    await makeRequest({
        courseId: course!.dataValues.id,
        teacher: unAssignedTeacher!.dataValues.id
    })
        .expect(201)

    // check if teacher assigned to the course
    const assigned = await TeacherCourse.findOne({
        where: {
            courseId: course!.dataValues.id,
            teacherId: unAssignedTeacher!.dataValues.id
        }
    })
    expect(assigned).not.toBeNull()
    expect(assigned!.dataValues.status).toEqual(TeacherAssignedStatus.ASSIGNED)
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)
})



it("Unassign a teacher then reassign successfully", async () => {

    // get some teacher assigned to a course
    const teacherCourse = await TeacherCourse.findOne({
        where: {
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacherCourse).not.toBeNull()

    // update the status to unassigned
    await teacherCourse!.update({
        [TeacherCourseKeys.STATUS]: TeacherAssignedStatus.UN_ASSIGNED
    })


    // now make request to assign the teacher again
    await makeRequest({
        courseId: teacherCourse!.dataValues.courseId,
        teacher: teacherCourse!.dataValues.teacherId
    })
        .expect(201)

    // reload the teacher course data
    await teacherCourse!.reload()
    expect(teacherCourse!.dataValues.status).toEqual(TeacherAssignedStatus.ASSIGNED)
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)
})