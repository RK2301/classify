import request from "supertest";
import { app } from "../../app";
import { Shift as ShiftAttr, UserRole } from "@rkh-ms/classify-lib";
import { Shift } from "../../models/shift";
import { User } from "../../models/user";
import { Op } from "sequelize";


it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .post("/api/shifts/start")
        .send()
        .expect(401);
});


it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .post("/api/shifts/start")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});


it('send error when send invalid start location in the request body', async () => {
    const res = await request(app)
        .post("/api/shifts/start")
        .set("Cookie", global.signin())
        .send({
            startLocation: ['aa', 20.2121]
        })
        .expect(400);

    expect(res.body.errors[0]?.message).toBeDefined()
})


it('create shift successfully and saves to the DB', async () => {

    // get one of the teachers to create a shift for him
    // we make sure that is no active shift so won't get error when try to start a new shift
    const users = (await User.findAll({
        where: {
            id: {
                //get teachers that still have shift active
                //then get users that doesn't have active shift
                [Op.notIn]: (await Shift.findAll({
                    attributes: ['teacherId'],
                    where: {
                        endTime: {
                            [Op.is]: null
                        }
                    }
                })).map(shift => shift.dataValues.teacherId)
            }
        }
    }))
    console.log(users);
    const user = users[0]


    const res = await request(app)
        .post("/api/shifts/start")
        .set("Cookie", global.signin({
            role: UserRole.Teacher,
            id: user.dataValues.id
        }))
        .send({
            startLocation: [27.8621, 20.2121]
        })
        .expect(201);

    const newShift = res.body as ShiftAttr
    expect(newShift).toBeDefined()

    //fetch the DB and check if really the shift created
    const shift = await Shift.findByPk(newShift.id)

    expect(shift).toBeDefined()
    expect(shift!.dataValues.id).toEqual(newShift.id)
})


it('return error when try to start shift and there already active one', async () => {

    // get a shift for a teacher not yet ended and try make a call for start new shift 
    const shift = await Shift.findOne({
        where: {
            endTime: {
                [Op.is]: null
            }
        }
    })

    await request(app)
        .post('/api/shifts/start')
        .set('Cookie', global.signin({ id: shift?.dataValues.teacherId }))
        .send({
            startLocation: [212.212, 32.212]
        })
        .expect(400)

    // check if the no shift created in the DB
    const active_shifts = await Shift.findAll({
        where: {
            teacherId: shift?.dataValues.teacherId,
            endTime: {
                [Op.is]: null
            }
        }
    })

    expect(active_shifts.length).toEqual(1)

})