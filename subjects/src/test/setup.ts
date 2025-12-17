import { UserRole } from "@rkh-ms/classify-lib";
import jwt from "jsonwebtoken";
import { sequelize } from "../connect";
import { Subject } from "../models/subject";
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

    await Subject.sync()

    // add some subjects to the DB
    await Subject.bulkCreate(sampleSubjects)
});


beforeEach(async () => {
    jest.clearAllMocks();
    try {
        await sequelize.authenticate()
        // await User.truncate()
        // await Shift.truncate()

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
