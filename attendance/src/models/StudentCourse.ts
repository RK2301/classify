import { DataTypes, Model } from "sequelize";
import dayjs from "dayjs";

import { StudentCourse as StudentCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { StudentCourseKeys, StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums";

import { sequelize } from "../connect";
import { User } from "./User";


type StudentCourseCreateAttrs = Omit<StudentCourseAttrs, StudentCourseKeys.WITHDRAWAL_DATE>

class StudentCourse extends Model<StudentCourseAttrs, StudentCourseCreateAttrs> { }

StudentCourse.init({
    studentId: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    courseId: {
        type: DataTypes.INTEGER,
        primaryKey: true
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
        allowNull: false
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

/**M:1 assocation between student and StudentCourse */
StudentCourse.belongsTo(User, {
    foreignKey: StudentCourseKeys.STUDENT_ID,
    onDelete: 'CASCADE'
})

User.hasMany(StudentCourse, {
    foreignKey: StudentCourseKeys.STUDENT_ID,
    onDelete: 'CASCADE'
});


export { StudentCourse }