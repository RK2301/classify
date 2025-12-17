import { DataTypes, Model } from "sequelize";

import { TeacherCourse as TeacherCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { CourseKeys, TeacherAssignedStatus, TeacherCourseKeys } from "@rkh-ms/classify-lib/enums";
import { sequelize } from "../connect";
import { Course } from "./Course";

type TeacherCourseCreateAttrs = Omit<TeacherCourseAttrs, TeacherCourseKeys.UNASSIGNED_AT>

class TeacherCourse extends Model<TeacherCourseAttrs, TeacherCourseCreateAttrs> { }


TeacherCourse.init({
    courseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Course,
            key: CourseKeys.ID
        }
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

/**M:1 assocation between teacher and TeacherCourse */
TeacherCourse.belongsTo(Course, {
    foreignKey: TeacherCourseKeys.COURSE_ID,
    onDelete: 'CASCADE'
})

Course.hasMany(TeacherCourse, {
    foreignKey: TeacherCourseKeys.COURSE_ID,
    onDelete: 'CASCADE'
})

export { TeacherCourse }