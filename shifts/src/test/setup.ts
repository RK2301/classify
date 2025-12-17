import { UserRole } from "@rkh-ms/classify-lib";
import jwt from "jsonwebtoken";
import { sequelize } from "../connect";
import { User } from "../models/user";
import { Shift, ShiftCreationAttributes } from "../models/shift";
import { sampleUsers } from "./sample-users";
import { sampleShifts } from "./sample-shifts";
import { DataTypes } from "sequelize";

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

    /**convert locations to strings before add initial data */
    Shift.addHook('beforeBulkCreate', (shifts) => {
        shifts.forEach(shift => {
            if (typeof shift.dataValues.startLocation !== 'string')
                shift.setDataValue('startLocation', JSON.stringify(shift.dataValues.startLocation) as unknown as { type: 'Point', coordinates: [number, number] })

            if (shift.dataValues.endLocation && typeof shift.dataValues.endLocation !== 'string')
                shift.setDataValue('endLocation', JSON.stringify(shift.dataValues.endLocation) as unknown as { type: 'Point', coordinates: [number, number] })
        })
    })

    /**turn location to string if they passed as object */
    Shift.addHook('beforeCreate', (shift) => {
        if (typeof shift.dataValues.startLocation !== 'string')
            shift.setDataValue('startLocation', JSON.stringify(shift.dataValues.startLocation) as unknown as { type: 'Point', coordinates: [number, number] })

        if (shift.dataValues.endLocation && typeof shift.dataValues.endLocation !== 'string')
            shift.setDataValue('endLocation', JSON.stringify(shift.dataValues.endLocation) as unknown as { type: 'Point', coordinates: [number, number] })
    })

    /**turn location to string if they passed as object */
    Shift.addHook('beforeValidate', (shift) => {
        if (typeof shift.dataValues.startLocation !== 'string')
            shift.setDataValue('startLocation', JSON.stringify(shift.dataValues.startLocation) as unknown as { type: 'Point', coordinates: [number, number] })

        if (shift.dataValues.endLocation && typeof shift.dataValues.endLocation !== 'string')
            shift.setDataValue('endLocation', JSON.stringify(shift.dataValues.endLocation) as unknown as { type: 'Point', coordinates: [number, number] })
    })

    await User.sync()
    await Shift.sync()


    // add the samples users before each test
    await User.bulkCreate(sampleUsers.map(user => user))

    // add sample shifts before each test
    await Shift.bulkCreate(sampleShifts.map(shift => shift as ShiftCreationAttributes))

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
