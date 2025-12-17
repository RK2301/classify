import { UserAttributes } from "@rkh-ms/classify-lib";
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../connect";

type UserAttr = Omit<UserAttributes, 'password' | 'role'>
interface UserCreationAttr extends Optional<UserAttr, 'version'> { }

class User extends Model<UserAttr, UserCreationAttr> {
    declare id: string;
    declare firstName: string;
    declare lastName: string;
    declare email: string;
    declare phone: string;
    declare version: number;
}

User.init({
    id: {
        type: DataTypes.CHAR(9),
        primaryKey: true,
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.CHAR(10),
        allowNull: true
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
})

export { User }