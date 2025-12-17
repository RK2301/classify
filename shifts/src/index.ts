import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib';
import { app } from './app'
import { sequelize } from './connect'
import { User } from './models/user';
import { UserUpdatedConsumer } from './rabbitMQ/consumers/UserUpdatedConsumer';
import { TeacherCreatedConsumer } from './rabbitMQ/consumers/TeacherCreatedConsumer';
import { Shift } from './models/shift';

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

    // Connect to MySQL
    try {
        await sequelize.authenticate()
        await User.sync()
        await Shift.sync()

    } catch (err) {
        console.error("Failed to connect to MySQL: ", err);
        throw new Error("Could not connect to MySQL");
    }
}

const startRabbitMQ = async () => {
    try {
        if (!process.env.RabbitMQ_URL)
            throw new Error('RabbitMQ_URL must be defined');

        await rabbitMQ_Wrapper.connect(process.env.RabbitMQ_URL)

        //start consuming messages
        await new UserUpdatedConsumer(rabbitMQ_Wrapper.channel).consume()
        await new TeacherCreatedConsumer(rabbitMQ_Wrapper.channel).consume()
    } catch (err) {
        console.error(err)
    }
}

app.listen(3000, () => {
    start()
    startRabbitMQ()
    console.log('Shifts service listening on port 3000!!')
})