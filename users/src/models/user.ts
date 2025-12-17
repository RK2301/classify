import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connect";
import { Password } from "@rkh-ms/classify-lib";
import { UserAttributes, UserCreationAttributes, UserRole } from "@rkh-ms/classify-lib";


class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    // static associations: { teacher: Association<User, Teacher>; };
    declare id: string;
    declare firstName: string;
    declare lastName: string;
    declare email: string;
    declare phone?: string;
    declare password: string;
    declare role: UserRole;
    declare version: number;
}

User.init({
    id: {
        type: DataTypes.CHAR(9),
        primaryKey: true,
        allowNull: false,
        validate: {
            is: /^[0-9]{9}$/i
        }
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
        allowNull: true,
        // validate: {
        //     is: /^[0-9]{10}$/i
        // }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        // validate: {
        //     is: /^.{8,}$/i
        // }
    },
    role: {
        type: DataTypes.ENUM(UserRole.Manager, UserRole.Student, UserRole.Teacher),
        allowNull: false,
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    modelName: "User",
    tableName: "users",
    hooks: {
        beforeCreate: async (user) => {
            if (user.password)
                user.password = await Password.toHash(user.password);
        },
        beforeUpdate: async (user) => {
            const changed = user.changed()

            if (changed && !user.isNewRecord)
                user.version++

            // If password is changed, hash it
            if (user.changed('password')) {
                user.password = await Password.toHash(user.password);
            }

        }
    }
});


export { User }
