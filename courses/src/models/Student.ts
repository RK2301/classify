import { StudentSpecificAttr } from "@rkh-ms/classify-lib";
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connect";
import { User } from "./User";

class Student extends Model<StudentSpecificAttr> {
}

Student.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    grade: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
            min: 1,
            max: 13
        }
    },
    fatherName: {
        type: DataTypes.STRING
    },
    motherName: {
        type: DataTypes.STRING
    },
    fatherPhone: {
        type: DataTypes.STRING
    },
    motherPhone: {
        type: DataTypes.STRING
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'students',
    modelName: 'Student'
})

User.hasOne(Student, { foreignKey: 'id' })
Student.belongsTo(User, { foreignKey: 'id' });


export { Student }