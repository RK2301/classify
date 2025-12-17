import { TeacherSpecificAttr } from "@rkh-ms/classify-lib";
import { DataTypes, Model } from "sequelize";
import { User } from "./User";
import { sequelize } from "../connect";


class Teacher extends Model<TeacherSpecificAttr> { }

Teacher.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'teachers',
    modelName: 'Teacher'
})

User.hasOne(Teacher, {
    foreignKey: 'id'
})
Teacher.belongsTo(User, { foreignKey: 'id' })


export { Teacher }