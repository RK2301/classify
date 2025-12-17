import { ManagerCreationAttributes, ManagerSpecificAttr } from "@rkh-ms/classify-lib/";
import { DataTypes, Model } from "sequelize";
import { Teacher } from "./teacher";
import { sequelize } from "../connect";

class Manager extends Model<ManagerSpecificAttr, ManagerCreationAttributes> {
    declare id: string;
    declare startDate: string;
    declare endDate?: string | null;
    declare version: number;
}

Manager.init({
    id: {
        type: DataTypes.CHAR(9),
        primaryKey: true,
        references: {
            model: Teacher,
            key: 'id'
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    modelName: 'Manager',
    tableName: 'managers',
    hooks: {
        beforeCreate: (manager) => {
            if (!manager.get().startDate)
                manager.startDate = new Date().toISOString()
        },
        beforeUpdate: (manager) => {
            if (Array.isArray(manager.changed()) && manager.changed.length > 0 &&
                !manager.isNewRecord)
                manager.version++
        }
    }
})
Teacher.hasOne(Manager, { foreignKey: 'id' })
Manager.belongsTo(Teacher, { foreignKey: 'id' })

export { Manager }