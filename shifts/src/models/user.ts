import { UserAttributes, UserRole } from '@rkh-ms/classify-lib'
import { sequelize } from '../connect'
import { DataTypes, Model } from 'sequelize';

/**This type describe a user attibutes we want in shifts service */
export type UserMainAttributes = Pick<UserAttributes, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'role' | 'version'>;

class User extends Model<UserMainAttributes> implements UserMainAttributes {
    declare id: UserMainAttributes['id'];
    declare firstName: UserMainAttributes['firstName'];
    declare lastName: UserMainAttributes['lastName'];
    declare email: UserMainAttributes['email'];
    declare phone?: UserMainAttributes['id'];
    declare role: UserMainAttributes['role'];
    declare version: UserMainAttributes['version'];
}

User.init({
    id: {
        type: DataTypes.CHAR(9),
        primaryKey: true,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.CHAR(10),
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM(UserRole.Manager, UserRole.Student, UserRole.Teacher),
        allowNull: false,
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    sequelize,
    tableName: 'users',
    modelName: 'User',
})

export { User }