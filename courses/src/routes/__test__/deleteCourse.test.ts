import request from "supertest";
import { app } from "../../app";
import { API } from "@rkh-ms/classify-lib/api";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { CourseKeys } from "@rkh-ms/classify-lib/enums";
import { Course } from "../../models/Course";
import { Lesson } from "../../models/Lesson";
import { TeacherCourse } from "../../models/TeacherCourse";
import { StudentCourse } from "../../models/StudentCourse";

const CourseAPIS = API.courses

/**a function to make call to delete a course */
const makeRequest = (id: number) =>
    request(app)
        .delete(CourseAPIS.delete(id))
        .set('Cookie', global.signin())
        .send()



it('Return error after trying to delete a course and not logged in', async () => {
    await request(app)
        .delete(CourseAPIS.delete(3))
        .expect(401)
})


it('Return error after trying to delete a course but don\'nt have permission', async () => {
    await request(app)
        .delete(CourseAPIS.delete(2))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send()
        .expect(403)
})


it('Return error after trying to delete a course, but pass invalid id - not number', async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errorField = (body.errors as ErrorAttr['errors'])[0].field
    expect(errorField).toEqual(CourseKeys.ID)
})


it('Return error after trying to delete a course, but not exists in the DB', async () => {

    await makeRequest(10000)
        .expect(404)
})


it('Delete course successfully', async () => {
    const courseId = (await Course.findOne())!.dataValues.id

    await makeRequest(courseId)
        .expect(204)

    // check if the course removed from the DB
    const deletedCourse = await Course.findByPk(courseId)
    expect(deletedCourse).toBeNull()

    // make sure also all lessons related to the course deleted
    const courseLessons = await Lesson.findAll({
        where: {
            course_id: courseId
        }
    })
    expect(courseLessons.length).toEqual(0)

    // make sure no more teacher assigned to the course
    const courseTeachers = await TeacherCourse.findAll({
        where: {
            courseId
        }
    })
    expect(courseTeachers.length).toEqual(0)


    // make sure also no students are still enrolled for that course
    const courseStudents = await StudentCourse.findAll({
        where: {
            courseId
        }
    })
    expect(courseStudents.length).toEqual(0)


    // make sure an event emitted to RabbitMQ indicating a course removed
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)
})