import { DataTypes, Model } from "sequelize";

import { sequelize } from "../connect";
import { Teacher } from "./teacher";
import { Subject } from "./subject";
import { SubjectKeys } from "@rkh-ms/classify-lib/enums";

interface TeacherSubjectsAttributes {
    teacherId: string;
    subjectId: number;
}

class TeacherSubjects extends Model<TeacherSubjectsAttributes> { }

TeacherSubjects.init({
    teacherId: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: {
            model: Teacher,
            key: 'id'
        }
    },
    subjectId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Subject,
            key: SubjectKeys.ID
        }
    }
}, {
    sequelize,
    tableName: 'teacher_subjects',
    modelName: 'TeacherSubjects'
})


export { TeacherSubjects }