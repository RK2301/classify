import request from "supertest";
import { app } from "../../app";
import { Shift as ShiftAttr, UserRole } from "@rkh-ms/classify-lib";
import { Shift } from "../../models/shift";
import { User } from "../../models/user";
import { Op } from "sequelize";


it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .put("/api/shifts/end")
        .send()
        .expect(401);
});


it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .put("/api/shifts/end")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});


it('send error when send invalid end location or id, in the request body', async () => {
    const res = await request(app)
        .put("/api/shifts/end")
        .set("Cookie", global.signin())
        .send({
            endLocation: ['aa', 20.2121],
            id: 'hello'
        })
        .expect(400);

    expect(res.body.errors?.length).toEqual(2)
})


it('get error response when ask to end shift not exists', async () => {

    const maxId: number = await Shift.max('id')

    const res = await request(app)
        .put("/api/shifts/end")
        .set("Cookie", global.signin())
        .send({
            endLocation: [30.312, 20.2121],
            id: maxId + 1
        })
        .expect(404);

    expect(res.body.errors[0].message).toBeDefined();

})


it('update shift successfully and saves changes to the DB', async () => {

    //fetch a shift not yet ended and make a request to end it
    const shift_to_end = await Shift.findOne({
        where: {
            endTime: {
                [Op.is]: null
            }
        }
    })

    // make req to end the shift
    await request(app)
        .put("/api/shifts/end")
        .set("Cookie", global.signin({
            id: shift_to_end?.dataValues.teacherId
        }))
        .send({
            endLocation: [27.8621, 20.2121],
            id: shift_to_end?.dataValues.id
        })
        .expect(200);

    //fetch the DB and check if really the shift ended
    const shift = await Shift.findByPk(shift_to_end?.dataValues.id)
    console.log(shift?.dataValues);


    expect(shift).toBeDefined()
    expect(shift!.dataValues.endTime).toBeDefined()
})


it('return error when teacher try to end a shift not created by him', async () => {

    // get a shift that not yet ended
    const shift = await Shift.findOne({
        where: {
            endTime: {
                [Op.is]: null
            }
        }
    })

    // get teacher and his id different from the that one has a
    // shift not yet ended
    const teacher_not_own_the_shift = await User.findOne({
        where: {
            role: UserRole.Teacher,
            id: {
                [Op.not]: shift?.dataValues.teacherId
            }
        }
    })

    const res = await request(app)
        .put('/api/shifts/end')
        .set('Cookie', global.signin({
            id: teacher_not_own_the_shift?.dataValues.id,
            role: teacher_not_own_the_shift?.dataValues.role
        }))
        .send({
            endLocation: [212.212, 32.212],
            id: shift?.dataValues.id
        })
        .expect(403)

    console.log(res.body);


    // make sure the shift not updated in the DB
    const shift_after_req = await Shift.findByPk(shift!.dataValues.id)

    expect(shift_after_req).toBeDefined()
    expect(shift_after_req?.dataValues.endTime).toBeNull()
})