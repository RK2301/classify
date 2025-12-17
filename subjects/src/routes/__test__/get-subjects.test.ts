import request from "supertest";
import { app } from "../../app";
import { UserRole } from "@rkh-ms/classify-lib";
import { Subject } from "../../models/subject";
import { Op } from "sequelize";

/**a function to make call to add a new subject */
const makeRequest = (search?: string) =>
    request(app)
        .get(`/api/subjects${search ? `?search=${search}` : ''}`)
        .set('Cookie', global.signin())


it('Return error after trying to get subjects and not logged in', async () => {
    await request(app)
        .get('/api/subjects')
        .expect(401)
})


it('Return error after trying to get subjects but don\'nt have permission', async () => {
    await request(app)
        .get('/api/subjects')
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})


it('Get all subject successfully', async () => {

    const { body: subjects } = await makeRequest()
        .expect(200)

    expect(Array.isArray(subjects)).toBeTruthy()

    // fetch subject from the DB and expect to be same length as the one from the response
    const allSubjectsDB = await Subject.findAll({})
    expect(subjects.length).toEqual(allSubjectsDB.length)
})


it('Get subjects by search term successfully', async () => {

    const search = 'ו'

    const { body: subjects } = await makeRequest(search)
        .expect(200)
    expect(Array.isArray(subjects)).toBe(true)


    // now fetch the subjects based on the search term and check if same length
    const subjectsDB = await Subject.findAll({
        where: {
            [Op.or]: [
                { ar: { [Op.like]: `%${search}%` } },
                { he: { [Op.like]: `%${search}%` } },
                { en: { [Op.like]: `%${search}%` } }
            ]
        }
    })

    expect(subjects.length).toEqual(subjectsDB.length)

})