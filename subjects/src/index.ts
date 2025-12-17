import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib';
import { app } from './app'
import { sequelize } from './connect'
import { Subject } from './models/subject';

const start = async () => {

    //check if env variables are defined
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

    //connect to MySQL
    try {
        await sequelize.authenticate()
        await Subject.sync()

    } catch (err) {
        console.error("Failed to connect to MySQL: ", err);
        throw new Error("Could not connect to MySQL");
    }
}

const connectToRabbitMQ = async () => {
    if (!process.env.RabbitMQ_URL)
        throw new Error('RabbitMQ_URL must be defined');

    await rabbitMQ_Wrapper.connect(process.env.RabbitMQ_URL)
}

app.listen(3000, async () => {
    await start()
    await connectToRabbitMQ()
    console.log('Subjects service listening on port 3000!');
})