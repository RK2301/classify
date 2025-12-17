import { DataTypes, Model, ModelAttributes, Optional } from "sequelize";
import { Shift as ShiftAttr } from '@rkh-ms/classify-lib'
import { User } from "./user";
import { sequelize } from "../connect";

export interface ShiftCreationAttributes extends Optional<ShiftAttr, 'id' | 'version'> { }

class Shift extends Model<ShiftAttr, ShiftCreationAttributes> {
};

const ShiftModelAttributes: ModelAttributes<Shift, ShiftAttr> = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    startLocation: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: false //user must provide a start location
    },
    endLocation: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: true //user can leave the end location empty
    },
    teacherId: {
        type: DataTypes.CHAR(9),
        references: {
            model: User,
            key: 'id'
        }
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}

// if it's test environment then make start and end locations as strings
if (process.env.NODE_ENV === 'test') {
    (ShiftModelAttributes.startLocation as any).type = DataTypes.STRING;
    (ShiftModelAttributes.endLocation as any).type = DataTypes.STRING;
}

Shift.init(ShiftModelAttributes, {
    sequelize,
    tableName: 'shifts',
    modelName: 'Shift',
    hooks: {
        beforeUpdate(shift) {
            // increment the version number before updating
            shift.setDataValue('version', shift.dataValues.version + 1)
        }
    }
})

User.hasMany(Shift, { foreignKey: 'teacherId' });
Shift.belongsTo(User, { foreignKey: 'teacherId' })

export { Shift }