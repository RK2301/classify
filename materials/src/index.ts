import { rabbitMQ_Wrapper } from "@rkh-ms/classify-lib";
import { app } from "./app";
import { sequelize } from "./connect";
import { StudentCourse } from "./models/StudentCourse";
import { TeacherCourse } from "./models/TeacherCourse";
import { CourseCreatedConsumer } from "./rabbit_mq/consumers/CourseCreatedConsumer";
import { CourseDeletedConsumer } from "./rabbit_mq/consumers/CourseDeletedConsumer";
import { StudentEnrolledConsumer } from "./rabbit_mq/consumers/StudentEnrolledConsumer";
import { StudentWithdrawalConsumer } from "./rabbit_mq/consumers/StudentWithdrawalConsumer";
import { UnassignTeacherConsumer } from "./rabbit_mq/consumers/UnassignTeacherConsumer";
import { TeacherAssignedConsumer } from "./rabbit_mq/consumers/TeacherAssignedConsumer";
import { Course } from "./models/Course";
import { Material } from "./models/Material";
import { MaterialFiles } from "./models/MaterialFiles";

const start = async () => {

    if (!process.env.FIREBASE_CONFIG)
        throw new Error("FIREBASE_CONFIG must be defined")

    if (!process.env.MYSQL_HOST)
        throw new Error("MYSQL_HOST must be defined")

    if (!process.env.MYSQL_USER)
        throw new Error("MYSQL_USER must be defined")

    if (!process.env.MYSQL_ROOT_PASSWORD)
        throw new Error("MYSQL_ROOT_PASSWORD must be defined");

    if (!process.env.MYSQL_DATABASE)
        throw new Error("MYSQL_DATABASE must be defined");

    if (!process.env.JWT_KEY)
        throw new Error("JWT_KEY must be defined");

    try {
        await sequelize.authenticate()

        await Course.sync()
        await TeacherCourse.sync()
        await StudentCourse.sync()

        await Material.sync()
        await MaterialFiles.sync()

    } catch (err) {
        console.error(`Error connecting to MYSQL!`)
        console.error(err)

        throw err
    }

}


const startRabbitMQ = async () => {
    if (!process.env.RabbitMQ_URL)
        throw new Error('RabbitMQ_URL must be defined');

    try {
        await rabbitMQ_Wrapper.connect(process.env.RabbitMQ_URL);

        await new CourseCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new CourseDeletedConsumer(rabbitMQ_Wrapper.channel).consume()

        await new StudentEnrolledConsumer(rabbitMQ_Wrapper.channel).consume()
        await new StudentWithdrawalConsumer(rabbitMQ_Wrapper.channel).consume()

        await new UnassignTeacherConsumer(rabbitMQ_Wrapper.channel).consume()
        await new TeacherAssignedConsumer(rabbitMQ_Wrapper.channel).consume()

        console.log('Connected to RabbitMQ successfully!');

    } catch (err) {
        console.log('Error connecting to RabbitMQ: ', err);
        throw err
    }

}


app.listen(3000, async () => {
    await start()
    await startRabbitMQ()
    console.log('Materials service listen on port 3000!')
})