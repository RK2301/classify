import { rabbitMQ_Wrapper, SendEmail } from "@rkh-ms/classify-lib";
import { app } from "./app";
import { StudentCreatedConsumer } from "./rabbitMQ/consumers/student_created_consumer";
import { sequelize } from "./connect";
import { ResetPassword } from "./models/reset-password";
import { User } from "./models/user";
import { TeacherCreatedConsumer } from "./rabbitMQ/consumers/teacher-created-consumer";
import { UserUpdatedConsumer } from "./rabbitMQ/consumers/user-updated-consumer";

const start = () => {
    if (!process.env.GMAIL_USER)
        throw new Error("GMAIL_USER must be defined")
    if (!process.env.GMAIL_PASS)
        throw new Error("GMAIL_PASS must be defined")

    SendEmail.getInstance().setup(process.env.GMAIL_USER, process.env.GMAIL_PASS)
}
const startMYSQL = async () => {
    if (!process.env.MYSQL_HOST)
        throw new Error("MYSQL_HOST must be defined");

    if (!process.env.MYSQL_USER)
        throw new Error("MYSQL_USER must be defined")

    if (!process.env.MYSQL_ROOT_PASSWORD)
        throw new Error("MYSQL_ROOT_PASSWORD must be defined")

    if (!process.env.MYSQL_DATABASE)
        throw new Error("MYSQL_DATABASE must be defined")

    if (!process.env.JWT_KEY)
        throw new Error("JWT_KEY must be defined")

    try {
        await sequelize.authenticate()
        await User.sync()
        await ResetPassword.sync()

        console.log(`Connected to MYSQL at: ${process.env.MYSQL_HOST}`);

    } catch (err) {
        console.error(`Error while connecting to MYSQL: \n`, err);
    }
}

const startRabbitMQ = async () => {
    try {
        if (!process.env.RabbitMQ_URL)
            throw new Error('RabbitMQ_URL must be defined')

        await rabbitMQ_Wrapper.connect(process.env.RabbitMQ_URL)
        // rabbitMQ_Wrapper.handleClosingConnection()

        const channel = rabbitMQ_Wrapper.channel

        //listen for student created event
        new StudentCreatedConsumer(channel).consume()
        new TeacherCreatedConsumer(channel).consume()
        new UserUpdatedConsumer(channel).consume()
    } catch (err) {
        console.error(`Error while connect to RabbitMQ: \n`, err);
    }
}



app.listen(3000, () => {
    startMYSQL()
    startRabbitMQ()
    start()
    console.log('reset-password service listen at port 3000!!');
})