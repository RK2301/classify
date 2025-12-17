import { UserRole } from "@rkh-ms/classify-lib";
import jwt from "jsonwebtoken";

import { sequelize } from "../connect";
import { User } from "../models/user";
import { Student } from "../models/student";
import { Teacher } from "../models/teacher";
import { Manager } from "../models/manager";
import { Subject } from "../models/subject";
import { TeacherSubjects } from "../models/teacher_subject";
import { sampleSubjects } from "./sample-subjects";

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
    await User.sync()
    await Student.sync()
    await Teacher.sync()
    await Manager.sync()
    await Subject.sync()
    await TeacherSubjects.sync()

    // add initial subjects to the DB
    await Subject.bulkCreate(sampleSubjects.map((s, index) => ({
        ...s,
        version: 1,
        id: index + 1
    })))
});

beforeEach(async () => {
    jest.clearAllMocks();
    try {
        await sequelize.authenticate()
        await User.truncate()
        await Student.truncate()
        await Teacher.truncate()
        await Manager.truncate()
    } catch (err) {
        console.error(err);
    }
});

afterAll(async () => {
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
