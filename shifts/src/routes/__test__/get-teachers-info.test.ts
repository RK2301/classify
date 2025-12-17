import request from "supertest";
import { app } from "../../app";
import { UserRole } from "@rkh-ms/classify-lib";
import { User, UserMainAttributes } from "../../models/user";


it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .get("/api/shifts/teachers-info")
        .expect(401);
});


it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .get("/api/shifts/teachers-info")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .expect(403);
});

it('return teachers data successfully', async () => {
    const res = await request(app)
        .get("/api/shifts/teachers-info")
        .set("Cookie", global.signin())
        .expect(200);

    const teachers: UserMainAttributes[] = res.body
    expect(Array.isArray(teachers)).toBe(true)

    //fetch the teachers from DB
    const dbTeachers = await User.findAll({})

    expect(teachers.length).toEqual(dbTeachers.length)
})