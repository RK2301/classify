import { UserRole } from "@rkh-ms/classify-lib";
import jwt from "jsonwebtoken";

import { TeacherCourse as TeacherCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { TeacherAssignedStatus, TeacherCourseKeys } from "@rkh-ms/classify-lib/enums";

import { sequelize } from "../connect";
import { StudentCourse } from "../models/StudentCourse";
import { TeacherCourse } from "../models/TeacherCourse";

import { sampleTeachers } from "./sample-teachers";
import { sampleCourses } from "./sample-courses";
import { sampleEnrollStudents } from "./sample-enrolled-students";
import { Material } from "../models/Material";
import { sampleMaterials } from "./sample-materials";
import { Course } from "../models/Course";
import { MaterialFiles } from "../models/MaterialFiles";

// if not defined then the test run in local and not in CI 
if (!process.env.FIREBASE_CONFIG) {
    process.env.FIREBASE_CONFIG = JSON.stringify(require('../../classify-dcb76-firebase-adminsdk-fbsvc-552875ce91.json'))
}


import { bucket } from "../config/firebase";

declare global {
    var signin: (user?: {
        id?: string,
        role?: UserRole
    }) => string[];
}

jest.mock("../connect.ts");

// all files created during tests will be under "test" directory
// jest.mock('../utils/pathToCourse')
// jest.mock('../utils/pathToFile')
// jest.mock('../utils/pathToMaterial')

// setup.ts (top-level, runs before your tests)
jest.mock('../utils/pathToCourse', () => ({
    __esModule: true,                  // keep for ESM interop
    pathToCourse: (courseId: number) =>
        `test/materials/course_${courseId}/`
}));

jest.mock('../utils/pathToFile', () => ({
    __esModule: true,
    pathToFile: (courseId: number, materialId: number, file: string) =>
        `test/materials/course_${courseId}/material_${materialId}/${file}`
}));

jest.mock('../utils/pathToMaterial', () => ({
    __esModule: true,
    pathToMaterial: (courseId: number, materialId: number) =>
        `test/materials/course_${courseId}/material_${materialId}/`
}));


// return a new directory to create files under it
jest.mock("@rkh-ms/classify-lib", () => {
    const actualLib = jest.requireActual('@rkh-ms/classify-lib')

    return {
        ...actualLib,
        rabbitMQ_Wrapper: {
            channel: {
                assertExchange: jest.fn().mockResolvedValue(undefined),
                publish: jest.fn().mockImplementation((exchange: string, routingKey: string, content: Buffer) => true)
            }
        }
    }
});



// console.log('FIREBASE_CONFIG value: ');
// console.log(process.env.FIREBASE_CONFIG);

beforeAll(async () => {

    try {
        process.env.JWT_KEY = "asdf";

        await sequelize.sync({ force: true })

        await Course.sync()
        await StudentCourse.sync()
        await TeacherCourse.sync()
        await Material.sync()
        await MaterialFiles.sync()

        // add courses to the DB
        await Course.bulkCreate(sampleCourses)

        // assign teachers and students to courses
        const sampleAssignedTeachers: Omit<TeacherCourseAttrs, TeacherCourseKeys.UNASSIGNED_AT>[] = []
        sampleCourses.forEach((course, index) => {
            const totalTeachers = sampleTeachers.length;

            // assign teachers to courses in a round-robin fashion
            const teacher1 = sampleTeachers[index % totalTeachers];
            const teacher2 = sampleTeachers[(index + 1) % totalTeachers];

            sampleAssignedTeachers.push({
                courseId: course.id,
                teacherId: teacher1.id,
                assigned_at: new Date().toISOString(),
                status: TeacherAssignedStatus.ASSIGNED,
                version: 1
            })

            sampleAssignedTeachers.push({
                courseId: course.id,
                teacherId: teacher2.id,
                assigned_at: new Date().toISOString(),
                status: TeacherAssignedStatus.ASSIGNED,
                version: 1
            })
        });
        await TeacherCourse.bulkCreate(sampleAssignedTeachers)

        // enroll students to courses
        await StudentCourse.bulkCreate(sampleEnrollStudents)

        // console.log("*** Test setup is ready ***");

    } catch (err) {
        console.error(err);
        throw err
    }
});


beforeEach(async () => {
    jest.clearAllMocks();

    try {
        await sequelize.authenticate()

        await Material.truncate()

        await Material.bulkCreate(sampleMaterials)

    } catch (err) {
        console.error(err);
        throw err;
    }

    // delete all files on bucket
    // if error occured then no need to throw it
    try {
        await bucket.deleteFiles({ prefix: 'test/', force: true })
    }catch(err){
        // console.error(err);
    }
});



afterAll(async () => {
    console.log("*** Shutting down test setup ***");

    await sequelize.drop()
    await sequelize.close()

    // after tests done,  clear all files created in the test directory
    try {
        await bucket.deleteFiles({ prefix: 'test/', force: true })
    }catch(err){
        // console.error(err);
    }
});



global.signin = (user?: {
    id?: string,
    role?: UserRole
}) => {
    //build a JWT payload {id, email}
    const payload = {
        id: user && user.id ? user.id : '211509237',
        firstName: 'Rami',
        lastName: 'Khattab',
        email: 'rami.khattab0@gmail.com',
        phone: '0543957965',
        role: user && user.role ? user.role : UserRole.Manager
    };

    //Create JWT
    //the process.env.JWT_KEY! is because we define it in beforeall func
    const token = jwt.sign(payload, process.env.JWT_KEY!);

    //build session obj {jwt: token}
    const session = { jwt: token };

    //turn the session into JSON
    const sessionJSON = JSON.stringify(session);

    //take sessionJSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString("base64");

    //returns a string thats the cookie with encoded data
    return [`session=${base64}`];
};
