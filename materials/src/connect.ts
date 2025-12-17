import { Sequelize } from 'sequelize';

//connect to mysql
const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE!,
    process.env.MYSQL_USER!,
    process.env.MYSQL_ROOT_PASSWORD!,
    {
        host: process.env.MYSQL_HOST!,
        dialect: 'mysql',
    }
);

export { sequelize }