import request from "supertest";
import { app } from "../../app";
import { Subject as SubjectAttributes } from "@rkh-ms/classify-lib/interfaces";
import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib";
import { Subject } from "../../models/subject";
import { SubjectKeys } from "@rkh-ms/classify-lib/enums";

/**a function to make call to update a subject */
const makeRequest = (subjectId: number, subject: Omit<SubjectAttributes, 'version' | 'id'>) =>
    request(app)
        .put(`/api/subjects/${subjectId}`)
        .set('Cookie', global.signin())
        .send(subject)


it('Return error after trying to update a subject and not logged in', async () => {
    await request(app)
        .put('/api/subjects/1')
        .send({})
        .expect(401)
})


it('Return error after trying to update a subject but don\'nt have permission', async () => {
    await request(app)
        .put('/api/subjects/1')
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send({})
        .expect(403)
})


it('Return error after trying to update a subject without pass he value or valid subject id', async () => {

    // invalid subject id
    const { body } = await makeRequest('ddd' as unknown as number, {
        ar: 'arabic',
        en: 'english',
        he: 'hebrew'
    })
        .expect(400)

    expect(body.errors[0].message).toBeDefined()

    // missing he value
    const res = await makeRequest(10, {
        ar: 'arabic',
        en: 'english',
        he: ''
    })
        .expect(400)
    expect(res.body.errors[0].field).toEqual(SubjectKeys.HE)
})


it('Return error after trying to update a subject that not exist', async () => {

    await makeRequest(9999, {
        he: 'מתמטיקה',
        ar: 'رياضيات',
        en: 'math'
    })
        .expect(404)
})


it('Update a subject successfully', async () => {

    // first get a subject from the DB
    const subject = await Subject.findOne()
    expect(subject).not.toBeNull()

    const res = await makeRequest(subject!.dataValues.id, {
        he: subject!.dataValues.he + ' updated',
        ar: subject!.dataValues.ar + ' updated',
        en: subject!.dataValues.en + ' updated'
    })
        .expect(200)

    // check if a emit event was published to rabbitMQ
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(1)

})


it('Return error after trying to update a subject with duplicate value/values', async () => {

    const subjects = await Subject.findAll({
        limit: 2
    })
    expect(subjects.length).toEqual(2)

    const subject1 = subjects[0].dataValues
    const subject2 = subjects[1].dataValues

    // make a request to update subject2 with the values of subject1
    const res = await makeRequest(subject2.id, {
        ar: subject2.ar,
        en: subject2.en,
        he: subject1.he
    })
        .expect(400)


    // expect to receive error related to the he field
    expect(res.body.errors[0].field).toEqual(SubjectKeys.HE)

    // expect that no event was published to rabbitMQ
    expect(rabbitMQ_Wrapper.channel.publish).toHaveBeenCalledTimes(0)

})