import request from "supertest";
import { app } from "../../../app";
import { API } from "@rkh-ms/classify-lib/api";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { LessonKeys } from "@rkh-ms/classify-lib/enums";
import { Lesson } from "../../../models/Lesson";
import { Course } from "../../../models/Course";


const LessonAPIS = API.lessons

/**a function to make call to delete a lesson */
const makeRequest = (id: number) =>
    request(app)
        .delete(LessonAPIS.delete(id))
        .set('Cookie', global.signin());


it('Return error after trying to add a lesson and not logged in', async () => {
    await request(app)
        .delete(LessonAPIS.delete(1))
        .send()
        .expect(401)
})


it('Return error after trying to add a lesson but don\'nt have permission', async () => {
    await request(app)
        .delete(LessonAPIS.delete(2))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})



it('Return error when make request to delete lesson while pass invalid lesson id', async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to both start and end time
    expect(errors.find(err => err.field === 'id')).toBeDefined()
})



it("Return error when ask to delete not exists lesson", async () => {
    await makeRequest(10000).expect(404)
})



it("Delete lesson successfully", async () => {

    // get some lesson
    const lesson = await Lesson.findOne()
    expect(lesson).not.toBeNull()

    const course = await Course.findByPk(lesson!.dataValues.course_id)
    expect(course).not.toBeNull()

    const numberOfLessons = course!.dataValues.numberOfLessons

    // now make request to delete the course
    await makeRequest(lesson!.dataValues.id)
        .expect(204)

    // check if lessons deleted from the DB
    const deletedLesson = await Lesson.findByPk(lesson!.dataValues.id)
    expect(deletedLesson).toBeNull()

    // check if the course update it's number of lessons
    await course!.reload()
    expect(course!.dataValues.numberOfLessons).toEqual(numberOfLessons - 1)

    // expect 2 events emitted to the RabbitMQ
    // one for lesson deleted
    // second for course updated
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(2)
})