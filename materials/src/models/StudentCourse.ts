import { DataTypes, Model } from "sequelize";
import dayjs from "dayjs";

import { StudentCourse as StudentCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { CourseKeys, StudentCourseKeys, StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums";

import { sequelize } from "../connect";
import { Course } from "./Course";


type StudentCourseCreateAttrs = Omit<StudentCourseAttrs, StudentCourseKeys.WITHDRAWAL_DATE | StudentCourseKeys.STATUS | 'version'>

class StudentCourse extends Model<StudentCourseAttrs, StudentCourseCreateAttrs> { }

StudentCourse.init({
    studentId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    courseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Course,
            key: CourseKeys.ID
        }
    },
    enrolled_at: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    withDrawalDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(StundetEnrollmentStatus.ACTIVE, StundetEnrollmentStatus.WITHDRAWN),
        allowNull: false,
        defaultValue: StundetEnrollmentStatus.ACTIVE
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'students_courses',
    modelName: 'StudentCourse'
})




/**M:1 assocation between teacher and TeacherCourse */
StudentCourse.belongsTo(Course, {
    foreignKey: StudentCourseKeys.COURSE_ID,
    onDelete: 'CASCADE'
})

Course.hasMany(StudentCourse, {
    foreignKey: StudentCourseKeys.COURSE_ID,
    onDelete: 'CASCADE'
})


export { StudentCourse }