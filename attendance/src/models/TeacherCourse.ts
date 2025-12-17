import { DataTypes, Model } from "sequelize";

import { TeacherCourse as TeacherCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { TeacherAssignedStatus, TeacherCourseKeys } from "@rkh-ms/classify-lib/enums";
import { sequelize } from "../connect";

type TeacherCourseCreateAttrs = Omit<TeacherCourseAttrs, TeacherCourseKeys.UNASSIGNED_AT>

class TeacherCourse extends Model<TeacherCourseAttrs, TeacherCourseCreateAttrs> { }


TeacherCourse.init({
    courseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    teacherId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    assigned_at: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    unAssigned_at: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(TeacherAssignedStatus.ASSIGNED, TeacherAssignedStatus.UN_ASSIGNED),
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'teachers_courses',
    modelName: 'TeacherCourse'
})


export { TeacherCourse }