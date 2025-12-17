import request from "supertest";
import { app } from "../../app";
import { Shift as ShiftAttr, UserRole } from "@rkh-ms/classify-lib";
import { Shift } from "../../models/shift";
import { User } from "../../models/user";
import { Op } from "sequelize";
import dayjs from "dayjs";
import { sequelize } from "../../connect";


const makeRequest = (shiftId: number, startTime?: string, endTime?: string) => request(app)
    .put(`/api/shifts/${shiftId}`)
    .set("Cookie", global.signin())
    .send({
        startTime,
        endTime
    })


it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .put("/api/shifts/10")
        .expect(401);
});


it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .put("/api/shifts/10")
        .set("Cookie", global.signin({ role: UserRole.Teacher }))
        .expect(403);
});


it('send error when send invalid id, in the request', async () => {

    const res = await request(app)
        .put("/api/shifts/sdas")
        .set("Cookie", global.signin())
        .send({
            startTime: new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString(),
            endTime: new Date().toISOString()
        })
        .expect(400);

    expect(res.body.errors?.length).toEqual(1)
})


it('send error when send invalid start or end time, in the request', async () => {

    const res = await makeRequest(20, new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString(), 'hello it date !!')
        .expect(400);

    expect(res.body.errors?.length).toEqual(1)
})


it('send error when send invalid start time greater than end time, in the request', async () => {


    const res = await makeRequest(20, dayjs('2025-04-01').toISOString(), dayjs('2025-03-01').toISOString())
        .expect(400);

    expect(res.body.errors?.length).toEqual(1)
})


it('Get error response when ask to update shift not exists', async () => {

    const maxId: number = await Shift.max('id')

    const res = await makeRequest(maxId + 1, dayjs('2025-08-01').toISOString(), dayjs('2025-08-02').toISOString())
        .expect(404);

    expect(res.body.errors[0].message).toBeDefined();
})


it('Get error when try to update shift not yet ended', async () => {

    // fetch shift not yet ended
    const shift = await Shift.findOne({
        where: {
            endTime: {
                [Op.is]: null
            }
        }
    })

    //make request to update the shift and expect error response
    const res = await makeRequest(parseInt(shift!.dataValues.id), dayjs('2025-08-01').toISOString(), dayjs('2025-08-02').toISOString())
        .expect(400)

    console.log(res.body);

    expect(res.body.errors[0].message).toBeDefined()

})


it(`Get error response when try to update a shift that it\'s start end time conflicted with 
    another shift for the same teacher`, async () => {

    // Get teacher id that has more than one shift ended
    const teacher = await Shift.findOne({
        attributes: ['teacherId'],
        where: {
            endTime: {
                [Op.not]: null
            },
            startTime: {
                [Op.lte]: dayjs().toISOString()
            }
        },
        group: ['teacherId'],
        having: sequelize.literal(`COUNT(*) > 1`)
    })

    // fetch the shifts for that teacher that ended
    const teacher_shifts = await Shift.findAll({
        where: {
            teacherId: teacher?.dataValues.teacherId,
            endTime: {
                [Op.not]: null
            },
            startTime: {
                [Op.lte]: dayjs().toISOString()
            }
        }
    })

    // get the 2 shifts data
    const shift = teacher_shifts[0]
    const shift_to_update = teacher_shifts[1]

    const shiftLength = dayjs(shift.dataValues.endTime).diff(dayjs(shift.dataValues.startTime))
    const newStartTime = dayjs(shift.dataValues.startTime).add(shiftLength / 2, 'milliseconds')
    const newEndTime = dayjs(shift.dataValues.endTime).add(1, 'hour')


    // now make request to update the second shift with the conflicted times
    const res = await makeRequest(parseInt(shift_to_update.dataValues.id), newStartTime.toISOString(), newEndTime.toISOString())
        .expect(400)

    expect(res.body.errors[0].message).toBeDefined()
})


it('update shift successfully and saves changes to the DB', async () => {

    //fetch a shift not yet ended and make a request to end it
    const shift_to_update = await Shift.findOne({
        where: {
            endTime: {
                [Op.not]: null
            },
            startTime: {
                [Op.lte]: dayjs().toISOString()
            }
        }
    })

    console.log(`shift to update is: `);
    console.log(shift_to_update?.dataValues);



    const { startTime, endTime } = shift_to_update!.dataValues
    const shiftLength = dayjs(endTime).diff(dayjs(startTime))

    const newStartTime = dayjs(startTime).add(shiftLength / 2, 'milliseconds')

    // make req to udpate the shift
    await makeRequest(parseInt(shift_to_update!.dataValues.id), newStartTime.toISOString(), endTime!)
        .expect(200)


    //fetch the DB and check if really the shift ended
    const shift = await Shift.findByPk(shift_to_update?.dataValues.id)
    console.log(shift?.dataValues);


    expect(shift).toBeDefined()
    expect(dayjs(shift!.dataValues.startTime).toISOString()).toEqual(newStartTime.toISOString())
})