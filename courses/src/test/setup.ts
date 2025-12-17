import { UserRole } from "@rkh-ms/classify-lib";
import jwt from "jsonwebtoken";

import { TeacherCourse as TeacherCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { StudentCourse as StudentCourseAttrs } from "@rkh-ms/classify-lib/interfaces";

import { sequelize } from "../connect";
import { Subject } from '../models/Subject';
import { sampleSubjects } from "./sample-subjects";
import { Student } from "../models/Student";
import { Teacher } from "../models/Teacher";
import { Course } from "../models/Course";
import { TeacherCourse } from "../models/TeacherCourse";
import { StudentCourse } from "../models/StudentCourse";
import { Lesson } from "../models/Lesson";
import { sampleStudents } from "./sample-students";
import { User } from "../models/User";
import { sampleTeachers } from "./sample-teachers";
import { sampleCourses } from "./sample-courses";
import { sampleLessons } from "./sample-lessons";
import { StudentCourseKeys, TeacherCourseKeys } from "@rkh-ms/classify-lib/enums";

declare global {
    var signin: (user?: {
        id?: string,
        role?: UserRole
    }) => string[];
}

jest.mock("../connect.ts");

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

beforeAll(async () => {
    process.env.JWT_KEY = "asdf";
    await sequelize.sync({ force: true })

    await Subject.sync()
    await Student.sync()
    await Teacher.sync()
    await Course.sync()
    await TeacherCourse.sync()
    await StudentCourse.sync()
    await Lesson.sync()

    // add some subjects to the DB
    await Subject.bulkCreate(sampleSubjects.map((subject, index) => ({
        ...subject,
        id: index + 1,
        version: 1
    })))

    // add some students to the DB
    await User.bulkCreate(sampleStudents)
    await Student.bulkCreate(sampleStudents)
    console.log(`*** ${sampleStudents.length} students added to the DB ***`);


    // add some teachers to the DB
    await User.bulkCreate(sampleTeachers)
    await Teacher.bulkCreate(sampleTeachers)
    console.log(`*** ${sampleTeachers.length} teachers added to the DB ***`);

    console.log("*** Test setup is ready ***");

});


beforeEach(async () => {
    jest.clearAllMocks();

    try {
        await sequelize.authenticate()

        await Course.truncate()
        await TeacherCourse.truncate()
        await StudentCourse.truncate()
        await Lesson.truncate()

        // add some courses to the DB
        await Course.bulkCreate(sampleCourses)
        await Lesson.bulkCreate(sampleLessons)

        // assign teachers and students to courses
        const courses = await Course.findAll()

        const sampleAssignedTeachers: Omit<TeacherCourseAttrs, 'version' | TeacherCourseKeys.UNASSIGNED_AT | TeacherCourseKeys.STATUS>[] = []
        courses.forEach((course, index) => {
            const totalTeachers = sampleTeachers.length;

            // assign teachers to courses in a round-robin fashion
            const teacher1 = sampleTeachers[index % totalTeachers];
            const teacher2 = sampleTeachers[(index + 1) % totalTeachers];

            sampleAssignedTeachers.push({
                courseId: course.dataValues.id!,
                teacherId: teacher1.id!,
                assigned_at: new Date().toISOString()
            })

            sampleAssignedTeachers.push({
                courseId: course.dataValues.id!,
                teacherId: teacher2.id!,
                assigned_at: new Date().toISOString()
            })
        });
        await TeacherCourse.bulkCreate(sampleAssignedTeachers)


        // enroll students to courses
        const enrollStudents: Omit<StudentCourseAttrs, 'version' | StudentCourseKeys.STATUS>[] = sampleStudents
            .map((student, index) => {

                const course = courses[index % courses.length]

                return {
                    studentId: student.id!,
                    courseId: course.dataValues.id!,
                    enrolled_at: new Date().toISOString()
                }
            })
        await StudentCourse.bulkCreate(enrollStudents)

    } catch (err) {
        console.error(err);
        throw err;
    }
});

afterAll(async () => {
    console.log("*** Shutting down test setup ***");

    await sequelize.drop()
    await sequelize.close()
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
