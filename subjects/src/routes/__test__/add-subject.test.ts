import request from "supertest";
import { app } from "../../app";
import { Subject as SubjectAttributes } from "@rkh-ms/classify-lib/interfaces";
import { UserRole } from "@rkh-ms/classify-lib";
import { Subject } from "../../models/subject";

/**a function to make call to add a new subject */
const makeRequest = (subject: Omit<SubjectAttributes, 'version' | 'id'>) =>
    request(app)
        .post('/api/subjects')
        .set('Cookie', global.signin())
        .send(subject)


it('Return error after trying to add a subject and not logged in', async () => {
    await request(app)
        .post('/api/subjects')
        .send({})
        .expect(401)
})


it('Return error after trying to add a subject but don\'nt have permission', async () => {
    await request(app)
        .post('/api/subjects')
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send({})
        .expect(403)
})


it('Return error after trying to add a subject without pass he value', async () => {

    await makeRequest({
        ar: 'arabic',
        en: 'english',
        he: ''
    })
        .expect(400)
})


it('Add a subject successfully', async () => {

    const res = await makeRequest({
        he: 'מתמטיקה',
        ar: 'رياضيات',
        en: 'math'
    })
        .expect(201)

    const id = (res.body as SubjectAttributes).id
    expect(id).toBeDefined()


    // check if the DB have the subject with the specified id
    const subject = await Subject.findByPk(id)
    expect(subject).not.toBeNull()
})


it('Return error after trying to add a subject with duplicate value/values', async () => {

    const subject: Omit<SubjectAttributes, 'version' | 'id'> = {
        he: 'ספורט',
        ar: 'رياضة',
        en: 'sport'
    }


    await makeRequest(subject).expect(201)
    await makeRequest(subject).expect(400)

    // now expected only one subject in the DB with the specified name
    const subjects = await Subject.findAll({ where: { he: subject.he } })
    expect(subjects.length).toEqual(1)
})
