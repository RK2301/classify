import request from "supertest";
import { app } from "../../app";
import { UserRole } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";
import { Shift } from "../../models/shift";
import { Op } from "sequelize";

it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .get("/api/shifts/current")
        .expect(401);
});


it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .get("/api/shifts/current")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .expect(403);
});

it("Return a current shift data for a teacher that have active shift", async () => {

    // fetch a random user from the DB
    const users = await User.findAll({})
    const userIndex = Math.floor(Math.random() * users.length)

    const user = users[userIndex]

    const res = await request(app)
        .get('/api/shifts/current')
        .set('Cookie', global.signin({
            id: user.dataValues.id
        }))
        .send()
        .expect(200)

    //check if user has a active shift
    const currentShift = res.body.currentShift

    const shift = await Shift.findOne({
        where: {
            teacherId: user.id,
            endTime: {
                [Op.is]: null
            }
        }
    })

    // if there active shift then must be returned by the route
    if (shift)
        expect(currentShift).toBeDefined()
    else
        expect(currentShift).not.toBeDefined()

})