import request from "supertest";
import { app } from "../../app";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { Subject } from "../../models/subject";

/**a function to make call to delete a subject */
const makeRequest = (subjectId: number) =>
    request(app)
        .delete(`/api/subjects/${subjectId}`)
        .set('Cookie', global.signin())


it('Return error after trying to delete a subject and not logged in', async () => {
    await request(app)
        .delete('/api/subjects/1')
        .expect(401)
})


it('Return error after trying to delete a subject but don\'nt have permission', async () => {
    await request(app)
        .delete('/api/subjects/1')
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})


it('Return error after trying to delete a subject without pass valid subject id', async () => {

    // invalid subject id
    const { body } = await makeRequest('ddd' as unknown as number)
        .expect(400)


    expect(body.errors[0].message).toBeDefined()
})


it('Return error after trying to delete a subject that not exist', async () => {

    await makeRequest(9999)
        .expect(404)
})


it('Delete a subject successfully', async () => {

    // first get a subject
    const subject = await Subject.findOne()
    expect(subject).not.toBeNull()

    const subjectId = subject!.dataValues.id

    await makeRequest(subjectId)
        .expect(204)

    // expect a emit event was published to rabbitMQ
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)

    // check if the subject is deleted from the DB
    const deletedSubject = await Subject.findByPk(subjectId)
    expect(deletedSubject).toBeNull()
})