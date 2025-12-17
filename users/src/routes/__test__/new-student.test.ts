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
        .post("/api/users/students")
        .send()
        .expect(401);
});

it("retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});

it("retrun an error if passed uncorrect payload ", async () => {
    const res = await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin())
        .send()

    // console.log(res.body)
    expect(res.status).toEqual(400)
});

it("create student successfully ", async () => {
    const res = await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin())
        .send({
            id: '123456789',
            firstName: 'Rami',
            lastName: 'Khattab',
            email: 'rami.khattab0@gmail.com',
            grade: 10,
            fatherName: 'Opel Corsa'
        })

    // console.log(res.body)
    expect(res.status).toEqual(201)

    //access the DB and check if really the 
    //student exists in the DB
    const student = await Student.findByPk('123456789')
    expect(student).not.toBeNull()
    expect(student!.id).toEqual('123456789')
});

it('Response with 409 when trying to add already exists student', async () => {
    await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin())
        .send(studentData)
        .expect(201)

    await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin())
        .send(studentData)
        .expect(409)

    const users = await User.findAll({
        where: {
            id: studentData.id
        }
    })
    expect(users.length).toEqual(1)
})



// it("return an error if the ticket already reserved", async () => {
//   const ticket = Ticket.build({
//     id: new mongoose.Types.ObjectId().toHexString(),
//     title: "Just A Ticket",
//     price: 100,
//   });
//   await ticket.save();

//   //expiresAt aren't important right now, as we checks if the ticket reserved by checking the
//   //status only
//   const order = Order.build({
//     userId: "asdasdas",
//     status: OrderStatus.Created,
//     expiresAt: new Date(),
//     ticket: ticket,
//   });
//   await order.save();

//   await request(app)
//     .post("/api/orders")
//     .set("Cookie", global.signin())
//     .send({ ticketId: ticket.id })
//     .expect(400);
// });

// it("reserve a ticket successfully", async () => {
//   const ticket = Ticket.build({
//     id: new mongoose.Types.ObjectId().toHexString(),
//     title: "Just A Ticket",
//     price: 100,
//   });
//   await ticket.save();

//   await request(app)
//     .post("/api/orders")
//     .set("Cookie", global.signin())
//     .send({
//       ticketId: ticket.id,
//     })
//     .expect(201);
// });

// it("emit an order created event", async () => {
//   const ticket = Ticket.build({
//     id: new mongoose.Types.ObjectId().toHexString(),
//     title: "Just A Ticket",
//     price: 100,
//   });
//   await ticket.save();

//   await request(app)
//     .post("/api/orders")
//     .set("Cookie", global.signin())
//     .send({
//       ticketId: ticket.id,
//     })
//     .expect(201);

//   //check if event created
//   expect(natsWrapper.client.publish).toHaveBeenCalled();
// });
