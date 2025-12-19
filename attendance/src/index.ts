import { rabbitMQ_Wrapper } from "@rkh-ms/classify-lib";
import { app } from "./app";
import { sequelize } from "./connect";
import { Attendance } from "./models/Attendance";
import { Lesson } from "./models/Lesson";
import { StudentCourse } from "./models/StudentCourse";
import { TeacherCourse } from "./models/TeacherCourse";
import { User } from "./models/User";
import { CourseCreatedConsumer } from "./rabbit_mq/consumers/CourseCreatedConsumer";
import { CourseDeletedConsumer } from "./rabbit_mq/consumers/CourseDeletedConsumer";
import { LessonCreatedConsumer } from "./rabbit_mq/consumers/LessonCreatedConsumer";
import { LessonDeletedConsumer } from "./rabbit_mq/consumers/LessonDeletedConsumer";
import { LessonUpdatedConsumer } from "./rabbit_mq/consumers/LessonUpdatedConsumer";
import { LessonsStatusChanged } from "./rabbit_mq/consumers/LessonsStatusChangedConsumer";
import { StudentCreatedConsumer } from "./rabbit_mq/consumers/StudentCreatedConsumer";
import { StudentEnrolledConsumer } from "./rabbit_mq/consumers/StudentEnrolledConsumer";
import { StudentWithdrawalConsumer } from "./rabbit_mq/consumers/StudentWithdrawalConsumer";
import { UnassignTeacherConsumer } from "./rabbit_mq/consumers/UnassignTeacherConsumer";
import { UserUpdatedConsumer } from "./rabbit_mq/consumers/UserUpdatedConsumer";
import { TeacherAssignedConsumer } from "./rabbit_mq/consumers/TeacherAssignedConsumer";

const start = async () => {

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

        await User.sync()
        await Lesson.sync()

        await TeacherCourse.sync()
        await StudentCourse.sync()

        await Attendance.sync()

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
        await new LessonCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new LessonDeletedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new LessonUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new LessonsStatusChanged(rabbitMQ_Wrapper.channel).consume()

        await new StudentCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new StudentEnrolledConsumer(rabbitMQ_Wrapper.channel).consume()
        await new StudentWithdrawalConsumer(rabbitMQ_Wrapper.channel).consume()
        await new UnassignTeacherConsumer(rabbitMQ_Wrapper.channel).consume()
        await new TeacherAssignedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new UserUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()

        console.log('Connected to RabbitMQ successfully!');

    } catch (err) {
        console.log('Error connecting to RabbitMQ: ', err);
        throw err
    }

}


app.listen(3000, async () => {
    await start()
    await startRabbitMQ()
    console.log('Attendance service listen on port 3000!!');
})