import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connect";
import { ResetPasswordAttrs, ResetPasswordCreationAttrs } from "@rkh-ms/classify-lib";
import { User } from "./user";

class ResetPassword extends Model<ResetPasswordAttrs, ResetPasswordCreationAttrs> {
    declare id: string;
    declare userId: string;
    declare prc: string;
    declare expiresAt: string;
    declare used: boolean;
    declare prcSent: boolean;
    declare prcSentTime: string;
    declare passwordChangedAt: string;
}

ResetPassword.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.CHAR(9),
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    prc: {
        type: DataTypes.CHAR(4),
        allowNull: false,
        validate: {
            is: /^[0-9]{4}/
        }
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    prcSent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    prcSentTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    passwordChangedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'ResetPassword',
    tableName: 'reset_password'
})

User.hasOne(ResetPassword, { foreignKey: 'userId' })
ResetPassword.belongsTo(User, { foreignKey: 'userId' })
export { ResetPassword }