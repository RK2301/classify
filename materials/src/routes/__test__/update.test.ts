import request from "supertest";
import path from 'path';

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { MaterialKeys } from "@rkh-ms/classify-lib/enums";
import { MaterialFiles as MaterialFilesAttrs } from "@rkh-ms/classify-lib/interfaces";

import { app } from "../../app";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import { sampleTeachers } from "../../test/sample-teachers";
import { Material } from "../../models/Material";
import { MaterialFiles } from "../../models/MaterialFiles";
import { UpdateMaterialRequestBody } from "../updateMaterial";


const MaterialAPIS = API.materials

/**a function to make call to add materail
 * @param noFiles if true then don't attach files to the request, so the request will turn to update title and description
 */
const makeRequest = (materialId: number, attachFiles?: boolean,
    update?: UpdateMaterialRequestBody,
    authentication?: {
        id?: string,
        role?: UserRole
    }) => {

    const req = request(app)
        .patch(MaterialAPIS.update(materialId))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())

    if (attachFiles) {
        req
            .attach('files', path.resolve(__dirname, '../../test/files/shifts.png'))
            .attach('files', path.resolve(__dirname, '../../test/files/teachers.png'))
    }
    // don't attach null values to the request
    else if (update) {
        for (const [key, value] of Object.entries(update)) {
            if (value !== undefined && value !== null)
                req.field(key, value);
        }
    }

    return req
}



it('Return error after trying to update material, but not logged in', async () => {
    await request(app)
        .patch(MaterialAPIS.update(10))
        .send()
        .expect(401)
})


it('Return error after trying to update material but don\'nt have permission', async () => {
    await request(app)
        .patch(MaterialAPIS.update(10))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .send()
        .expect(403)
})


it("Return error after not pass valid material id", async () => {

    const { body } = await makeRequest(0, true)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === 'id')).toBeDefined()

})



it("Get error after try to update a material not exists", async () => {
    await makeRequest(100000, true)
        .expect(404)
})



it("Return error after try to update material as teacher, but not assigned to the course", async () => {

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

    // get material related to the course
    const material = await Material.findOne({
        where: {
            courseId: course.id
        }
    })
    expect(material).not.toBeNull()

    // make request to update material as teacher
    await makeRequest(material!.dataValues.id, true, undefined, {
        id: notAssigned!.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Update material successfully, by adding new files", async () => {

    //  first get a material
    const material = await Material.findOne()
    expect(material).not.toBeNull()

    // get files related to the material
    const materialFiles = await MaterialFiles.findAll({
        where: {
            materialId: material!.dataValues.id
        }
    })


    //  make request to update material by adding 2 new files
    const { body } = await makeRequest(material!.dataValues.id, true)
        .expect(201)

    const newFiles = body as MaterialFilesAttrs[]

    // 2 files where requested to be added, so their data must be returned
    expect(newFiles.length).toEqual(2)

    // now fetch material files again and expect 2 files added
    const reloadedFiles = await MaterialFiles.findAll({
        where: {
            materialId: material!.dataValues.id
        }
    })
    expect(reloadedFiles.length - 2).toEqual(materialFiles.length)

}, 15000)



it("Get error when try to update material but not pass files, title or description", async () => {

    //  first get a material
    const material = await Material.findOne()
    expect(material).not.toBeNull()


    await makeRequest(material!.dataValues.id, false)
        .expect(400)
})



it("Get error when pass invalid format for both title and description", async () => {

    //  first get a material
    const material = await Material.findOne()
    expect(material).not.toBeNull()

    const { body } = await makeRequest(material!.dataValues.id, false, {
        title: '' as unknown as string,
        description: '' as unknown as string
    }).expect(400)

    const errors = body.errors as ErrorAttr['errors']

    expect(errors.find(err => err.field === MaterialKeys.TITLE)).toBeDefined()
    expect(errors.find(err => err.field === MaterialKeys.DESCRIPTION)).toBeDefined()
})



it("Update material successfully", async () => {

    //  first get a material
    const material = await Material.findOne()
    expect(material).not.toBeNull()

    //  second define new values for description and title
    const newTitle = material!.dataValues.title + ' updated'
    const newDescription = material!.dataValues.description ?
        material!.dataValues.description + ' updated' : 'new description'

    // make request to update material
    await makeRequest(material!.dataValues.id, false, {
        title: newTitle,
        description: newDescription
    }).expect(200)

    // reload material from DB
    await material!.reload()

    expect(material!.dataValues.title).toEqual(newTitle)
    expect(material!.dataValues.description).toEqual(newDescription)
})