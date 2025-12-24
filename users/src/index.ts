import { rabbitMQ_Wrapper } from "@rkh-ms/classify-lib";
import { app } from "./app";
import { sequelize } from "./connect";
import { User } from "./models/user";
import { Student } from "./models/student";
import { Teacher } from "./models/teacher";
import { Manager } from "./models/manager";
import { RequestPasswordResetConsumer } from "./rabbitMQ/consumers/request-password-reset-consumer";
import { defaultManager } from "./scripts/defaultManager";
import { SubjectCreatedConsumer } from "./rabbitMQ/consumers/subject-created";
import { SubjectUpdatedConsumer } from "./rabbitMQ/consumers/subject-updated";
import { SubjectDeletedConsumer } from "./rabbitMQ/consumers/subject-deleted";
import { Subject } from "./models/subject";
import { TeacherSubjects } from "./models/teacher_subject";

const start = async () => {
    if (!process.env.MYSQL_HOST)
        throw new Error("MYSQL_HOST must be defined")

    if (!process.env.MYSQL_USER)
        throw new Error("MYSQL_USER must be defined")

    if (!process.env.MYSQL_ROOT_PASSWORD)
        throw new Error("MYSQL_ROOT_PASSWORD must be defined")

    if (!process.env.MYSQL_DATABASE)
        throw new Error("MYSQL_DATABASE must be defined")

    if (!process.env.JWT_KEY)
        throw new Error("JWT_KEY must be defined")

    try {
        setTimeout(async () => {
            await sequelize.authenticate()
            await User.sync()
            await Student.sync()
            await Teacher.sync()
            await Manager.sync()

            await Subject.sync()
            await TeacherSubjects.sync()

            console.log(`Connected to MYSQL at ${process.env.MYSQL_HOST}`);
        }, 5000)

    } catch (err) {
        console.error("Failed to connect to MYSQL! : ", err)
    }

}


const startRabbitMQ = async () => {
    try {
        if (!process.env.RabbitMQ_URL)
            throw new Error('RabbitMQ_URL must be defined')

        await rabbitMQ_Wrapper.connect(process.env.RabbitMQ_URL)

        //close channel and connection with rabbitmq when process exits
        //rabbitMQ_Wrapper.handleClosingConnection()
        new RequestPasswordResetConsumer(rabbitMQ_Wrapper.channel).consume()

        new SubjectCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
        new SubjectUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()
        new SubjectDeletedConsumer(rabbitMQ_Wrapper.channel).consume()
    } catch (err) {
        console.error(err);
    }
}

app.listen(3000, async () => {
    await start()
    await startRabbitMQ()

    // wait for 30 seconds to create the default manager
    setTimeout(() => defaultManager('123456789', 'Rami', 'Khattab', 'rami.khattab0@gmail.com'), 30000) ;

    console.log("Users Service Listening on port 3000 !!");
})