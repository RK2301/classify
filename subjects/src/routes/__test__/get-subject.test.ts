import request from "supertest";
import { app } from "../../app";
import { UserRole } from "@rkh-ms/classify-lib";
import { Subject } from "../../models/subject";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { Subject as SubjectAttrs } from "@rkh-ms/classify-lib/interfaces";

/**a function to make call to get subject data*/
const makeRequest = (subjectId: number) =>
    request(app)
        .get(`/api/subjects/${subjectId}`)
        .set('Cookie', global.signin())


it('Return error after trying to get subjects and not logged in', async () => {
    await request(app)
        .get('/api/subjects/1')
        .expect(401)
})


it('Return error after trying to get subjects but don\'nt have permission', async () => {
    await request(app)
        .get('/api/subjects/1')
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})


it('Get error after try to get subject with invalid id type - string instead of number', async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errorMessage = (body.errors as ErrorAttr['errors'])[0]?.message
    expect(errorMessage).toBeDefined()
})


it('Get error if try to get a subject not exists', async () => {

    await makeRequest(10000)
        .expect(404)
})


it('Get subject successfully', async() => {

    // first fetch some subject from the DB
    const subject = await Subject.findOne()
    expect(subject).toBeDefined()

    const subjectId = subject!.dataValues.id

    // now make request to get course data
    const { body } = await makeRequest(subjectId).expect(200)

    const reSubject = body as SubjectAttrs
    expect(reSubject).toBeDefined()
    
    // check that values are also correct
    expect(reSubject.id).toEqual(subjectId)
    expect(reSubject.ar).toEqual(subject!.dataValues.ar)
    expect(reSubject.en).toEqual(subject!.dataValues.en)
})
