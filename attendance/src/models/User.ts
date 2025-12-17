import { UserAttributes, UserRole } from "@rkh-ms/classify-lib";
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connect";

type UserAttr = Omit<UserAttributes, 'password'>

class User extends Model<UserAttr> { }

User.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    role: {
        type: DataTypes.ENUM(UserRole.Manager, UserRole.Student, UserRole.Teacher),
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'users',
    modelName: 'User'
})


export { User }