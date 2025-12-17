import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { TeacherAssignedStatus, TeacherCourseKeys } from "@rkh-ms/classify-lib/enums";

import { app } from "../../../app";
import { Course } from "../../../models/Course";
import { Teacher } from "../../../models/Teacher";
import { Op } from "sequelize";
import { TeacherCourse } from "../../../models/TeacherCourse";
import { UnassignRequestBody } from "../../teachers/unassign";

const TeacherCourseAPIS = API.teachers_course


/**a function to make call to unassign a teacher to a course */
const makeRequest = (unassign: UnassignRequestBody) =>
    request(app)
        .patch(TeacherCourseAPIS.unassign)
        .set('Cookie', global.signin())
        .send(unassign)


it('Return error after trying to unassign teachers and not logged in', async () => {
    request(app)
        .patch(TeacherCourseAPIS.unassign)
        .send()
        .expect(401)
})


it('Return error after trying to unassign a teacher but don\'nt have permission', async () => {
    request(app)
        .patch(TeacherCourseAPIS.unassign)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send()
        .expect(403)
})



it('Return error after trying to unassign a teacher to a course, but pass invalid id - not number', async () => {

    const { body } = await makeRequest({
        courseId: 'aa' as unknown as number,
        teacherId: ''
    })
        .expect(400)

    console.log(body);

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual(TeacherCourseKeys.COURSE_ID)


    const { body: body2 } = await makeRequest({
        courseId: -10,
        teacherId: ''
    })
        .expect(400)

    const errors2 = (body2.errors as ErrorAttr['errors'])
    expect(errors2.find(err => err.field === TeacherCourseKeys.TEACHER_ID)).toBeDefined()
})



it(`Return error after trying to unassign a teacher a course, but pass invalid teacher id`, async () => {

    const { body } = await makeRequest({
        courseId: 1,
        teacherId: '12345'
    })
        .expect(400)

    const errors = (body.errors as ErrorAttr['errors'])
    expect(errors.find(err => err.field === TeacherCourseKeys.TEACHER_ID)).toBeDefined()
})



it("Return error after try to unassign a teacher that not assigned to the course", async () => {

    // first get a course
    const course = await Course.findOne()
    expect(course).not.toBeNull()

    // get teacher that assigned to the course
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

    // make request to unassign the teacher and expect error
    await makeRequest({
        teacherId: unAssignedTeacher!.dataValues.id,
        courseId: course!.dataValues.id
    })
        .expect(400)
})



it("Unassign teacher successfully", async () => {

    // first get a teacher assigned to a course
    const teacherCourse = await TeacherCourse.findOne({
        where: {
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacherCourse).not.toBeNull()


    // now make request to unassign the teacher
    await makeRequest({
        courseId: teacherCourse!.dataValues.courseId,
        teacherId: teacherCourse!.dataValues.teacherId
    })
        .expect(200)

    // reload the teacher course
    await teacherCourse!.reload()

    expect(teacherCourse).not.toBeNull()
    expect(teacherCourse!.dataValues.status).toEqual(TeacherAssignedStatus.UN_ASSIGNED)
})