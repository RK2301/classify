import request from "supertest";

import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { MaterialFilesKeys, StundetEnrollmentStatus, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";
import { Material as MaterialAttrs, MaterialFiles as MaterialFilesAttrs } from "@rkh-ms/classify-lib/interfaces";


import { app } from "../../app";
import { sampleCourses } from "../../test/sample-courses";
import { TeacherCourse } from "../../models/TeacherCourse";
import { sampleTeachers } from "../../test/sample-teachers";
import { Material } from "../../models/Material";
import { updateMaterial } from "../../test/updateMaterial";
import { StudentCourse } from "../../models/StudentCourse";
import { sampleStudents } from "../../test/sample-students";
import { MaterialFiles } from "../../models/MaterialFiles";


const MaterialAPIS = API.materials

/**a function to make call to get course materials
 */
const makeRequest = (courseId: number, authentication?: {
    id?: string,
    role?: UserRole
}) => {

    const req = request(app)
        .get(MaterialAPIS.getMaterials(courseId))
        .set('Cookie', authentication ? global.signin(authentication) : global.signin())

    return req
}



it('Return error after trying to get a course materials, but not logged in', async () => {
    await request(app)
        .get(MaterialAPIS.getMaterials(1))
        .expect(401)
})



it("Return error after not pass valid course id", async () => {

    const { body } = await makeRequest(0)
        .expect(400)

    const errors = body.errors as ErrorAttr['errors']

    // error message must related to lesson id
    expect(errors.find(err => err.field === 'courseId')).toBeDefined()

})



it("Get error after try to get course materials, but course not exists", async () => {
    await makeRequest(100000)
        .expect(404)
})



it("Return error after try to get course materials as teacher, but not assigned to the course", async () => {

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



    // make request to get the materials as teacher not assigned to the course
    await makeRequest(course!.id, {
        id: notAssigned!.id,
        role: UserRole.Teacher
    })
        .expect(403)
})



it("Return error after try to get course materials as student, but not enrolled to the course", async () => {

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

    // make request to delete the file as teacher not enrolled to the course
    await makeRequest(course.id, {
        id: notEnrolled!.id,
        role: UserRole.Student
    })
        .expect(403)
})



it("Get course materials successfully", async () => {

    //  first get a course
    const course = sampleCourses[0]
    expect(course).toBeDefined()


    //  2. get a material, related to the course
    const material = await Material.findOne({
        where: {
            courseId: course.id
        }
    })
    expect(material).not.toBeNull()

    //  make request to update the material by adding 2 new files
    await updateMaterial(material!.dataValues.id)


    //  make request to get course materials
    const { body } = await makeRequest(course.id)
        .expect(200)

    console.log(body);
    const returnedMaterials = body as MaterialAttrs & { MaterialFiles: MaterialFilesAttrs[] }[]

    // expect the response contains all materials related to the course
    const materials = await Material.findAll({
        where: {
            courseId: course.id
        }
    })

    expect(returnedMaterials.length).toEqual(materials.length)

    // expect materials with files, the files exists in MaterialFiles attribute
    const materialWithFiles = await Material.findAll({
        where: {
            courseId: course.id
        },
        include: {
            model: MaterialFiles,
            required: true
        }
    })

    expect(returnedMaterials.filter(m => m.MaterialFiles && m.MaterialFiles.length > 0).length)
        .toEqual(materialWithFiles.length)
})




it("Get course materials, as teacher assigned to the course", async () => {


    //  first get a course
    const course = sampleCourses[0]
    expect(course).toBeDefined()


    //  2. get a material, related to the course
    const material = await Material.findOne({
        where: {
            courseId: course.id
        }
    })
    expect(material).not.toBeNull()

    //  make request to update the material by adding 2 new files
    await updateMaterial(material!.dataValues.id)

    // get a teacher assigned to the course
    const teacher = await TeacherCourse.findOne({
        where: {
            courseId: course.id,
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacher).not.toBeNull()


    //  make request to get course materials
    const { body } = await makeRequest(course.id, {
        id: teacher!.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(200)

    const returnedMaterials = body as MaterialAttrs & { MaterialFiles: MaterialFilesAttrs[] }[]

    // expect the response contains all materials related to the course
    const materials = await Material.findAll({
        where: {
            courseId: course.id
        }
    })

    expect(returnedMaterials.length).toEqual(materials.length)

    // expect materials with files, the files exists in MaterialFiles attribute
    const materialWithFiles = await Material.findAll({
        where: {
            courseId: course.id
        },
        include: {
            model: MaterialFiles,
            required: true
        }
    })

    expect(returnedMaterials.filter(m => m.MaterialFiles && m.MaterialFiles.length > 0).length)
        .toEqual(materialWithFiles.length)
})




it("Get course materials, as student enrolled to the course", async () => {


    //  first get a course
    const course = sampleCourses[0]
    expect(course).toBeDefined()


    //  2. get a material, related to the course
    const material = await Material.findOne({
        where: {
            courseId: course.id
        }
    })
    expect(material).not.toBeNull()

    //  make request to update the material by adding 2 new files
    await updateMaterial(material!.dataValues.id)

    // get a student enrolled to the course
    const student = await StudentCourse.findOne({
        where: {
            courseId: course.id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()


    //  make request to get course materials
    const { body } = await makeRequest(course.id, {
        id: student!.dataValues.studentId,
        role: UserRole.Student
    })
        .expect(200)

    const returnedMaterials = body as MaterialAttrs & { MaterialFiles: MaterialFilesAttrs[] }[]

    // expect the response contains all materials related to the course
    const materials = await Material.findAll({
        where: {
            courseId: course.id
        }
    })

    expect(returnedMaterials.length).toEqual(materials.length)

    // expect materials with files, the files exists in MaterialFiles attribute
    const materialWithFiles = await Material.findAll({
        where: {
            courseId: course.id
        },
        include: {
            model: MaterialFiles,
            required: true
        }
    })

    expect(returnedMaterials.filter(m => m.MaterialFiles && m.MaterialFiles.length > 0).length)
        .toEqual(materialWithFiles.length)
})