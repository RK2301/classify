import { DataTypes, Model } from "sequelize";
import { Attendance as AttendanceAttrs } from "@rkh-ms/classify-lib/interfaces";
import { AttendanceKeys, AttendanceStatus } from "@rkh-ms/classify-lib/enums";
import { sequelize } from "../connect";
import { User } from "./User";
import { Lesson } from "./Lesson";

type AttendanceCreateAttrs = Omit<AttendanceAttrs, 'version'>
class Attendance extends Model<AttendanceAttrs, AttendanceCreateAttrs> { }

Attendance.init({
    studentId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    lessonId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Lesson,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM(AttendanceStatus.Absent, AttendanceStatus.Attend, AttendanceStatus.Late),
        allowNull: false
    },
    reportedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'attendance',
    modelName: 'Attendance',
    hooks: {
        beforeSave: (attendance) => {
            if (attendance.changed() && !attendance.isNewRecord)
                attendance.setDataValue('version', attendance.dataValues.version + 1)
        }
    }
})

/**M:1 assocation between student and StudentCourse */
Attendance.belongsTo(User, {
    foreignKey: AttendanceKeys.STUDENT_ID,
    onDelete: 'CASCADE'
})

User.hasMany(Attendance, {
    foreignKey: AttendanceKeys.STUDENT_ID,
    onDelete: 'CASCADE'
});


/**M:1 assocation between teacher and TeacherCourse */
Attendance.belongsTo(Lesson, {
    foreignKey: AttendanceKeys.LESSON_ID,
    onDelete: 'CASCADE'
})

Lesson.hasMany(Attendance, {
    foreignKey: AttendanceKeys.LESSON_ID,
    onDelete: 'CASCADE'
})


export { Attendance }