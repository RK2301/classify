import request from "supertest";
import path from 'path';

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { MaterialKeys } from "@rkh-ms/classify-lib/enums";
import { Material as MaterialAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../app";
import { AddMaterialRequestBody } from "../add";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import { sampleTeachers } from "../../test/sample-teachers";
import { Course } from "../../models/Course";
import { Material } from "../../models/Material";
import { MaterialFiles } from "../../models/MaterialFiles";


const MaterialAPIS = API.materials

/**a function to make call to add materail */
const makeRequest = (add: AddMaterialRequestBody
    , authentication?: {
        id?: string,
        role?: UserRole
    }) => {

    const req = request(app)
        .post(MaterialAPIS.add)
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())
        .attach('files', path.resolve(__dirname, '../../test/files/shifts.png'))
        .attach('files', path.resolve(__dirname, '../../test/files/teachers.png'))


    // don't attach null values to the request
    for (const [key, value] of Object.entries(add)) {
        if (value !== undefined && value !== null)
            req.field(key, value);
    }

    return req
}



it('Return error after trying to add materail, but not logged in', async () => {
    await request(app)
        .post(MaterialAPIS.add)
        .send()
        .expect(401)
})


it('Return error after trying to add material but don\'nt have permission', async () => {
    await request(app)
        .post(MaterialAPIS.add)
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send()
        .expect(403)
})



it("Return error after not pass title", async () => {

    const { body } = await makeRequest({
        title: null as unknown as string,
        courseId: 1
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === MaterialKeys.TITLE)).toBeDefined()
})



it("Return error after not pass course id", async () => {

    const { body } = await makeRequest({
        title: 'hello',
        courseId: null as unknown as number
    })
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === MaterialKeys.COURSE_ID)).toBeDefined()
})



it("Return error after not passing files", async () => {

    const { body } = await request(app)
        .post(MaterialAPIS.add)
        .set('Cookie', global.signin())
        .send({
            courseId: 1,
            title: 'Hello'
        } as AddMaterialRequestBody)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']


    // error message must related to student id
    expect(errors.find(err => err.field === 'files')).toBeDefined()
})



it("Get error after try to add material for a course not exists", async () => {
    await makeRequest({
        title: 'Hello',
        courseId: 100000
    })
        .expect(404)
})



it("Return error after try to add material to the course as teacher, but not assigned to the course", async () => {

    //  first get a course
    const course = sampleCourses[0]

    //  get a teacher not assigned to the course
    const courseTeachers = (await TeacherCourse.findAll({
        where: {
            courseId: course.id
        }
    })).map(tc => tc.dataValues.teacherId)

    const notAssigned = sampleTeachers.find(t => !courseTeachers.find(tc => tc === t.id))
    expect(notAssigned).toBeDefined()


    // make request to report add material as teacher
    await makeRequest({
        title: 'Hello',
        courseId: course.id
    }, {
        id: notAssigned!.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Add material successfully", async () => {

    //  first get a course
    const course = await Course.findOne()
    expect(course).not.toBeNull()


    //  make request to add material
    const { body } = await makeRequest({
        title: 'Title',
        courseId: course!.dataValues.id
    })
        .expect(201)

    const newMaterial = body as MaterialAttrs

    // fetch the DB and check if material created
    const material = await Material.findByPk(newMaterial.id)

    expect(material).not.toBeNull()
    expect(material!.dataValues.title).toEqual('Title')

    // expect a 2 files created for the material
    const materialFiles = await MaterialFiles.findAll({
        where: {
            materialId: material!.dataValues.id
        }
    })
    expect(materialFiles.length).toEqual(2)

}, 15000)