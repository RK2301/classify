import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../connect";
import { StudentSpecificAttr } from "@rkh-ms/classify-lib";
import { User } from "./user";

export interface StudentCreationAttributes extends Optional<StudentSpecificAttr, 'version'> { }


class Student extends Model<StudentSpecificAttr, StudentCreationAttributes> {
    declare id: string;
    declare grade: number;
    declare motherName: string;
    declare motherPhone: string;
    declare fatherName: string;
    declare fatherPhone: string;
    declare version: number
}

Student.init({
    id: {
        type: DataTypes.CHAR(9),
        allowNull: false,
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
            max: 13,
            min: 1
        }
    },
    motherName: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    motherPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    fatherName: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    fatherPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    modelName: "Student",
    tableName: "students",
    hooks: {
        beforeUpdate: async (student) => {
            console.log(student.changed());

            if (student.changed() && !student.isNewRecord)
                student.version++
        }
    }
})

User.hasOne(Student, { foreignKey: 'id' })
Student.belongsTo(User, { foreignKey: 'id' })
export { Student }