import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib';
import { app } from './app'
import { sequelize } from './connect'
import { Subject } from './models/Subject';
import { SubjectCreatedConsumer } from './rabbit_mq/consumers/SubjectCreatedConsumer';
import { SubjectUpdatedConsumer } from './rabbit_mq/consumers/SubjectUpdatedConsumer';
import { SubjectDeletedConsumer } from './rabbit_mq/consumers/SubjectDeletedConsumer';
import { TeacherCreatedConsumer } from './rabbit_mq/consumers/TeacherCreatedConsumer';
import { TeacherUpdatedConsumer } from './rabbit_mq/consumers/TeacherUpdatedConsumer';
import { UserUpdatedConsumer } from './rabbit_mq/consumers/UserUpdatedConsumer';
import { StudnetCreatedConsumer } from './rabbit_mq/consumers/StudentCreatedConsumer';
import { StundetUpdatedConsumer } from './rabbit_mq/consumers/StudentUpdatedConsumer';
import { User } from './models/User';
import { Teacher } from './models/Teacher';
import { Student } from './models/Student';
import { Course } from './models/Course';
import { Lesson } from './models/Lesson';
import { StudentCourse } from './models/StudentCourse';
import { TeacherCourse } from './models/TeacherCourse';
import './tasks/lesson-status'

const start = async () => {

    if (!process.env.MYSQL_HOST)
        throw new Error("MYSQL_HOST must be defined");

    if (!process.env.MYSQL_USER)
        throw new Error("MYSQL_USER must be defined");

    if (!process.env.MYSQL_ROOT_PASSWORD)
        throw new Error("MYSQL_ROOT_PASSWORD must be defined");

    if (!process.env.MYSQL_DATABASE)
        throw new Error("MYSQL_DATABASE must be defined");

    if (!process.env.JWT_KEY)
        throw new Error("JWT_KEY must be defined");

    try {
        await sequelize.authenticate()

        await Subject.sync()
        await User.sync()
        await Teacher.sync()
        await Student.sync()


        await Course.sync()
        await Lesson.sync()

        await TeacherCourse.sync()
        await StudentCourse.sync()
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

        await new SubjectCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new SubjectUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new SubjectDeletedConsumer(rabbitMQ_Wrapper.channel).consume()

        await new TeacherCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new TeacherUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new StudnetCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new StundetUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()

        await new UserUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()

    } catch (err) {
        console.log('Error connecting to RabbitMQ: ', err);
        throw err
    }

}

app.listen(3000, async () => {
    await start()
    await startRabbitMQ()
    console.log('Courses services listen on port 3000')
})