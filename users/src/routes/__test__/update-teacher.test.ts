import request from "supertest";
import { app } from "../../app";
import { UserRole } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";
import { Teacher } from "../../models/teacher";
import { Subject } from "../../models/subject";
import { Op } from "sequelize";
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
        .put("/api/users/teachers")
        .send()
        .expect(401);
});


it("retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .put("/api/users/teachers")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});


it("retrun an error if passed uncorrect payload ", async () => {
    const res = await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin())
        .send({
            firstName: '',
            lastName: ''
        })

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


it('Response with 404 when trying to update non exists student', async () => {

    await request(app)
        .put("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({ ...teacherData, subjects: [1] })
        .expect(404)
})



it("update teacher successfully ", async () => {

    // get some subject id
    const subjectId = (await Subject.findOne())?.dataValues.id

    await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({ ...teacherData, subjects: [subjectId] })
        .expect(201)

    const newEmail: string = 'rami.fsj23@gmail.com'
    const newStartDate = new Date('2024-10-10').toISOString()

    // get another subject id
    const subjectId2 = (await Subject.findOne({
        where: {
            id: {
                [Op.notIn]: [subjectId!]
            }
        }
    }))?.dataValues.id

    const res = await request(app)
        .put("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({
            ...teacherData,
            email: newEmail,
            startDate: newStartDate,
            subjects: [subjectId, subjectId2]
        })
    expect(res.status).toEqual(200)
    console.log(res.body);


    //access the DB and check if really the
    //teacher exists in the DB
    const teacher = await Teacher.findByPk<Teacher & { User?: User }>(teacherData.id, {
        include: {
            model: User,
            required: true
        }
    })
    expect(teacher).not.toBeNull()
    expect(teacher!.User?.email).toEqual(newEmail)
    expect(teacher!.startDate).toEqual(newStartDate.split('T')[0])
    expect(teacher!.endDate).toBeNull()

    // check if the new subject added to the teacher
    const teacherSubject = await TeacherSubjects.findOne({
        where: {
            teacherId: teacherData.id,
            subjectId: subjectId2
        }
    })

    expect(teacherSubject).not.toBeNull()
});


it('delete a teacher subjects at update', async () => {
    // get some subject id
    const subjects = await Subject.findAll({
        limit: 2
    })
    expect(subjects.length).toEqual(2)

    const subjectsIds = subjects.map(s => s.dataValues.id)

    await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({ ...teacherData, subjects: subjectsIds })
        .expect(201)

    // remove some subject id
    subjectsIds.pop()

    await request(app)
        .put("/api/users/teachers")
        .set("Cookie", global.signin())
        .send({
            ...teacherData,
            subjects: subjectsIds
        })
        .expect(200)

    // check that the new subjects not contained the deleted one
    const teacherSubjects = await TeacherSubjects.findAll({
        where: {
            teacherId: teacherData.id
        }
    })

    expect(teacherSubjects.length).toEqual(subjectsIds.length)
})

