import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";

import { app } from "../../app";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import { sampleTeachers } from "../../test/sample-teachers";
import { Material } from "../../models/Material";
import { MaterialFiles } from "../../models/MaterialFiles";
import { updateMaterial } from "../../test/updateMaterial";
import { bucket } from "../../config/firebase";
import { pathToMaterial } from "../../utils/pathToMaterial";


const MaterialAPIS = API.materials

/**a function to make call to delete a material
 */
const makeRequest = (materialId: number, authentication?: {
    id?: string,
    role?: UserRole
}) => {

    const req = request(app)
        .delete(MaterialAPIS.deleteMaterial(materialId))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())

    return req
}



it('Return error after trying to delete a material, but not logged in', async () => {
    await request(app)
        .delete(MaterialAPIS.deleteMaterial(10))
        .expect(401)
})


it('Return error after trying to delete material but don\'nt have permission', async () => {
    await request(app)
        .delete(MaterialAPIS.deleteMaterial(10))
        .set('Cookie', global.signin({ role: UserRole.Student }))
        .expect(403)
})


it("Return error after not pass valid material id", async () => {

    const { body } = await makeRequest(0)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === 'id')).toBeDefined()

})



it("Get error after try to delete a material not exists", async () => {
    await makeRequest(100000)
        .expect(404)
})



it("Return error after try to delete material as teacher, but not assigned to the course", async () => {

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

    // make request to delete the material as teacher
    await makeRequest(material!.dataValues.id, {
        id: notAssigned!.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



// it("Delete material successfully", async () => {

//     //  first get a material
//     const material = await Material.findOne()
//     expect(material).not.toBeNull()

//     const prefix = pathToMaterial(material!.dataValues.courseId, material!.dataValues.id)

//     const [res] = await bucket.getFiles({
//         prefix
//     })
//     console.log('Files for material found in the firebase storage, before update:');
//     console.log(res.map(f => f.name));

//     //  make request to update the material by adding 2 new files
//     await updateMaterial(material!.dataValues.id)

//     // get files related to the material
//     const materialFiles = await MaterialFiles.findAll({
//         where: {
//             materialId: material!.dataValues.id
//         }
//     })
//     expect(materialFiles.length).toBeGreaterThan(0)


//     console.log('Material files:');
//     console.log(materialFiles.map(f => f.dataValues));

//     console.log(prefix);

//     // get refrence to material files from the storage
//     const [files] = await bucket.getFiles({
//         prefix
//     })
//     console.log('Files for material found in the firebase storage');
//     console.log(files.map(f => f.name));



//     //  make request to delete the material
//     await makeRequest(material!.dataValues.id)
//         .expect(204)


//     // make sure material is deleted
//     const deletedMaterial = await Material.findByPk(material!.dataValues.id)
//     expect(deletedMaterial).toBeNull()

//     // now fetch material files again and expect not to found any files
//     const reloadedFiles = await MaterialFiles.findAll({
//         where: {
//             materialId: material!.dataValues.id
//         }
//     })
//     expect(reloadedFiles.length).toEqual(0)

// }, 15000)




// it("Delete material successfully, as teacher assigned to the course", async () => {

//     //  first get a material
//     const material = await Material.findOne()
//     expect(material).not.toBeNull()

//     //  make request to update the material by adding 2 new files
//     await updateMaterial(material!.dataValues.id)

//     // get a teacher assigned to the course
//     const teacher = await TeacherCourse.findOne({
//         where: {
//             courseId: material!.dataValues.courseId,
//             status: TeacherAssignedStatus.ASSIGNED
//         }
//     })
//     expect(teacher).not.toBeNull()


//     // get files related to the material
//     const materialFiles = await MaterialFiles.findAll({
//         where: {
//             materialId: material!.dataValues.id
//         }
//     })
//     expect(materialFiles.length).toBeGreaterThan(0)


//     //  make request to delete the material 
//     await makeRequest(material!.dataValues.id, {
//         id: teacher!.dataValues.teacherId,
//         role: UserRole.Teacher
//     })


//     // make sure material is deleted
//     const deletedMaterial = await Material.findByPk(material!.dataValues.id)
//     expect(deletedMaterial).toBeNull()

//     // now fetch material files again and expect not to found any files
//     const reloadedFiles = await MaterialFiles.findAll({
//         where: {
//             materialId: material!.dataValues.id
//         }
//     })
//     expect(reloadedFiles.length).toEqual(0)

// }, 15000)
