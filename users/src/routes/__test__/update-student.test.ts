import request from "supertest";
import { app } from "../../app";
import { UserRole } from "@rkh-ms/classify-lib";
import { Student } from "../../models/student";
import { User } from "../../models/user";

const studentData = {
    id: '123456789',
    firstName: 'Rami',
    lastName: 'Khattab',
    email: 'rami.khattab0@gmail.com',
    grade: 10,
    fatherName: 'Opel Corsa'
}


it("retrun an error if the user not signed in", async () => {
    await request(app)
        .put("/api/users/students")
        .send()
        .expect(401);
});

it("retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .put("/api/users/students")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});

it("retrun an error if passed uncorrect payload ", async () => {
    const res = await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin())
        .send({
            firstName: ''
        })

    // console.log(res.body)
    expect(res.status).toEqual(400)
});

it("update student successfully ", async () => {
    await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin())
        .send(studentData)
        .expect(201)

    const res = await request(app)
        .put("/api/users/students")
        .set("Cookie", global.signin())
        .send({ ...studentData, email: 'rami.fsj23@gmail.com' })
    expect(res.status).toEqual(200)

    //access the DB and check if really the 
    //student exists in the DB
    const student = await Student.findByPk<Student & { User?: User }>(studentData.id, {
        include: {
            model: User,
            required: true
        }
    })
    expect(student).not.toBeNull()
    expect(student!.User?.email).toEqual('rami.fsj23@gmail.com')
});

it('Response with 404 when trying to update non exists student', async () => {

    await request(app)
        .put("/api/users/students")
        .set("Cookie", global.signin())
        .send({ ...studentData, email: 'rami.fsj23@gmail.com' })
        .expect(404)

})

