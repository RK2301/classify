import request from "supertest";
import { app } from "../../app";
import { Shift as ShiftAttr, UserRole } from "@rkh-ms/classify-lib";
import { Shift } from "../../models/shift";
import { User } from "../../models/user";
import { Op } from "sequelize";
import dayjs from "dayjs";

const makeRequest = (shiftId: number, userOptions?: {
    id?: string,
    role?: UserRole
}) => request(app)
    .delete(`/api/shifts/${shiftId}`)
    .set('Cookie', global.signin(userOptions))


it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .delete("/api/shifts/12")
        .expect(401);
});


it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .delete("/api/shifts/12")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .expect(403);
});


it('send error when send invalid id format in the URL', async () => {
    const res = await request(app)
        .delete("/api/shifts/hey")
        .set("Cookie", global.signin())
        .expect(400);

    expect(res.body.errors[0]?.message).toBeDefined()
})


it('got error when try to delete not exists shift', async () => {

    const res = await makeRequest(1000)
        .expect(404)

})


it('Got error when user try to delete shift not created by him', async () => {

    // got any shift
    const shift = await Shift.findOne({})

    //got user not owned the shift
    const user = await User.findOne({
        where: {
            role: UserRole.Teacher,
            id: {
                [Op.not]: shift?.dataValues.teacherId
            }
        }
    })

    //make req to delete the shift
    await makeRequest(parseInt(shift!.dataValues.id), {
        id: user?.dataValues.id,
        role: user?.dataValues.role
    })
        .expect(403)
})


it('Got error when user try to delete a shift created month before or later', async () => {

    const start = dayjs('2025-08-01T00:00:00.000Z')

    // fetch some shift created month before
    const shift = await Shift.findOne({
        where: {
            startTime: {
                [Op.lt]: start.toISOString()
            }
        }
    })

    await makeRequest(parseInt(shift!.dataValues.id), {
        id: shift?.dataValues.teacherId,
        role: UserRole.Teacher
    })
        .expect(403)
})


it('delete shift successfully from the DB', async () => {

    // got any shift
    const shift = await Shift.findOne({})

    //make request to delete the shift
    await makeRequest(parseInt(shift!.dataValues.id))
        .expect(204)

    // check if the shift removed from the DB
    const deleted_shift = await Shift.findByPk(shift?.dataValues.id)
    expect(deleted_shift).toBeNull()
})