import request from "supertest";
import { app } from "../../app";
import { UserRole } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";
import { Teacher } from "../../models/teacher";
import { Subject } from "../../models/subject";
import { TeacherSubjects } from "../../models/teacher_subject";

const teacherData = {
    id: '123456789',
    firstName: 'Rami',
    lastName: 'Khattab',
    email: 'rami.khattab0@gmail.com',
    startDate: new Date().toISOString()
}


it("retrun an error if the user not signed in", async () => {
    await request(app)
        .post("/api/users/teachers")
        .send()
        .expect(401);
});



it("retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});



it("retrun an error if passed uncorrect payload ", async () => {
    const res = await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({
            id: '12345678',
            firstName: ''
        })

    // console.log(res.body)
    expect(res.status).toEqual(400)
});


it("return an error when trying to pass invalid subjects", async () => {
    const { body } = await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({
            ...teacherData,
            subjects: ['hello']
        })
        .expect(400)

    expect(body.errors[0].message).toBeDefined()
})


it("create teacher successfully ", async () => {

    // get some subject id
    const subjectId = (await Subject.findOne())?.dataValues.id
    expect(subjectId).toBeDefined()

    const res = await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({
            ...teacherData,
            subjects: [subjectId]
        })
        .expect(201)

    console.log(res.body)

    //access the DB and check if really the
    //student exists in the DB
    const teacher = await Teacher.findByPk(teacherData.id)
    expect(teacher).not.toBeNull()
    expect(teacher!.startDate).toEqual(teacherData.startDate.split('T')[0])

    // check if a subject added to a teacher
    const teacherSubject = await TeacherSubjects.findOne({
        where: {
            teacherId: teacherData.id,
            subjectId
        }
    })
    expect(teacherSubject).not.toBeNull()
});



it('Response with 409 when trying to add already exists teacher', async () => {

    const subjectId = (await Subject.findOne())?.dataValues.id
    expect(subjectId).toBeDefined()


    await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({
            ...teacherData,
            subjects: [subjectId]
        })
        .expect(201)

    await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({
            ...teacherData,
            subjects: [100]
        })
        .expect(409)

    const users = await User.findAll({
        where: {
            id: teacherData.id
        }
    })
    expect(users.length).toEqual(1)
})


