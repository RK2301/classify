import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { MaterialFilesKeys, StundetEnrollmentStatus, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";

import { app } from "../../app";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import { sampleTeachers } from "../../test/sample-teachers";
import { Material } from "../../models/Material";
import { MaterialFiles } from "../../models/MaterialFiles";
import { updateMaterial } from "../../test/updateMaterial";
import { StudentCourse } from "../../models/StudentCourse";
import { sampleStudents } from "../../test/sample-students";


const MaterialAPIS = API.materials

/**a function to make call to download a material file
 */
const makeRequest = (materialId: number, fileId: number, authentication?: {
    id?: string,
    role?: UserRole
}) => {

    const req = request(app)
        .get(MaterialAPIS.downloadFile(materialId, fileId))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())

    return req
}



it('Return error after trying to download a material file, but not logged in', async () => {
    await request(app)
        .get(MaterialAPIS.downloadFile(10, 1))
        .expect(401)
})



it("Return error after not pass valid material id", async () => {

    const { body } = await makeRequest(0, 1)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === MaterialFilesKeys.MATERIAL_ID)).toBeDefined()

})


it("Return error after not pass valid file id", async () => {

    const { body } = await makeRequest(1, 'a' as unknown as number)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === 'fileId')).toBeDefined()

})



it("Get error after try to download a material file that not exists", async () => {
    await makeRequest(1, 100000)
        .expect(404)
})



it("Return error after try to download a file as teacher, but not assigned to the course", async () => {

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

    // update the material to add a file
    await updateMaterial(material!.dataValues.id)

    // get file related to the material
    const file = await MaterialFiles.findOne({
        where: {
            materialId: material!.dataValues.id
        }
    })
    expect(file).not.toBeNull()

    // make request to delete the file as teacher not assigned to the course
    await makeRequest(material!.dataValues.id, file!.dataValues.id, {
        id: notAssigned!.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Return error after try to download a file as student, but not enrolled to the course", async () => {

    //  first get a course
    const course = sampleCourses[0]

    //  get a student not enrolled to the course
    const courseStudents = (await StudentCourse.findAll({
        where: {
            courseId: course.id
        }
    })).map(sc => sc.dataValues.studentId)

    const notEnrolled = sampleStudents.find(s => !courseStudents.find(sc => sc === s.id))
    expect(notEnrolled).toBeDefined()

    // get material related to the course
    const material = await Material.findOne({
        where: {
            courseId: course.id
        }
    })
    expect(material).not.toBeNull()

    // update the material to add a file
    await updateMaterial(material!.dataValues.id)

    // get file related to the material
    const file = await MaterialFiles.findOne({
        where: {
            materialId: material!.dataValues.id
        }
    })
    expect(file).not.toBeNull()

    // make request to delete the file as teacher not enrolled to the course
    await makeRequest(material!.dataValues.id, file!.dataValues.id, {
        id: notEnrolled!.id,
        role: UserRole.Student
    })
        .expect(403)
})



it("Download file successfully", async () => {

    //  first get a material
    const material = await Material.findOne()
    expect(material).not.toBeNull()

    //  make request to update the material by adding 2 new files
    await updateMaterial(material!.dataValues.id)

    // get files related to the material
    const file = await MaterialFiles.findOne({
        where: {
            materialId: material!.dataValues.id
        }
    })
    expect(file).not.toBeNull()

    //  make request to download the file
    const { body } = await makeRequest(material!.dataValues.id, file!.dataValues.id)
        .expect(200)

    // the response must contain the signed url
    expect(body.url).toBeDefined()
})




it("Download file successfully, as teacher assigned to the course", async () => {

    //  first get a material
    const material = await Material.findOne()
    expect(material).not.toBeNull()

    //  make request to update the material by adding 2 new files
    await updateMaterial(material!.dataValues.id)


    // get file related to the material
    const file = await MaterialFiles.findOne({
        where: {
            materialId: material!.dataValues.id
        }
    })
    expect(file).not.toBeNull()

    // get a teacher assigned to the course
    const teacher = await TeacherCourse.findOne({
        where: {
            courseId: material!.dataValues.courseId,
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacher).not.toBeNull()


    //  make request to download the file, as a teacher
    const { body } = await makeRequest(material!.dataValues.id, file!.dataValues.id, {
        id: teacher!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(200)


    // the response must contain the signed url
    expect(body.url).toBeDefined()
})



it("Download file successfully, as student enrolled to the course", async () => {

    //  first get a material
    const material = await Material.findOne()
    expect(material).not.toBeNull()

    //  make request to update the material by adding 2 new files
    await updateMaterial(material!.dataValues.id)


    // get file related to the material
    const file = await MaterialFiles.findOne({
        where: {
            materialId: material!.dataValues.id
        }
    })
    expect(file).not.toBeNull()

    // get a student enrolled to the course
    const student = await StudentCourse.findOne({
        where: {
            courseId: material!.dataValues.courseId,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()


    //  make request to download the file, as a student
    const { body } = await makeRequest(material!.dataValues.id, file!.dataValues.id, {
        id: student!.dataValues.studentId,
        role: UserRole.Student
    })
        .expect(200)


    // the response must contain the signed url
    expect(body.url).toBeDefined()
})