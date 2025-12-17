import { TeacherCreationAttributes, TeacherSpecificAttr } from "@rkh-ms/classify-lib";
import { DataTypes, Model } from "sequelize";
import { User } from "./user";
import { sequelize } from "../connect";
import { Subject } from "./subject";
import { TeacherSubjects } from "./teacher_subject";

class Teacher extends Model<TeacherSpecificAttr, TeacherCreationAttributes> {
    // static associations: { user: Association<Teacher, User>; };
    declare id: string;
    declare startDate: string;
    declare endDate?: string;
    declare version: number;
}

Teacher.init({
    id: {
        type: DataTypes.CHAR(9),
        allowNull: false,
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
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    modelName: 'Teacher',
    tableName: 'teachers',
    hooks: {
        beforeCreate: async (teacher) => {
            if (!teacher.startDate)
                teacher.startDate = new Date().toISOString()
        },
        beforeUpdate: async (teacher) => {
            const changed = teacher.changed()

            console.log(changed);
            if (Array.isArray(changed) && changed.length > 0 && !teacher.isNewRecord)
                teacher.version++
        }
    }
})

User.hasOne(Teacher, { foreignKey: 'id' })
Teacher.belongsTo(User, { foreignKey: 'id' })

Teacher.belongsToMany(Subject, {
    through: TeacherSubjects,
    foreignKey: 'teacherId',
    otherKey: 'subjectId'
})

export { Teacher }