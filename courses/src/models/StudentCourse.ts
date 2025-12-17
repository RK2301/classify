import { DataTypes, Model } from "sequelize";
import dayjs from "dayjs";

import { StudentCourse as StudentCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { CourseKeys, StudentCourseKeys, StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums";

import { sequelize } from "../connect";
import { Student } from "./Student";
import { Course } from "./Course";


type StudentCourseCreateAttrs = Omit<StudentCourseAttrs, StudentCourseKeys.WITHDRAWAL_DATE | StudentCourseKeys.STATUS | 'version'>

class StudentCourse extends Model<StudentCourseAttrs, StudentCourseCreateAttrs> { }

StudentCourse.init({
    studentId: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: {
            model: Student,
            key: 'id'
        }
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
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'students_courses',
    modelName: 'StudentCourse',
    hooks: {
        beforeCreate: (studentCourse) => {
            if (dayjs(studentCourse.dataValues.enrolled_at).format('DD/MM/YYYY') !== dayjs().format('DD/MM/YYYY'))
                throw new Error('Enrollment day should be today\'s day ')
        },

        beforeSave: (studentCourse) => {
            if (studentCourse.changed() && !studentCourse.isNewRecord)
                studentCourse.setDataValue('version', studentCourse.dataValues.version + 1)
        }
    }
})

/**M:1 assocation between student and StudentCourse */
StudentCourse.belongsTo(Student, {
    foreignKey: StudentCourseKeys.STUDENT_ID
})

Student.hasMany(StudentCourse, {
    foreignKey: StudentCourseKeys.STUDENT_ID
});


/**M:N assocation between stundet and course */
Student.belongsToMany(Course, {
    through: StudentCourse,
    foreignKey: 'studentId',
    otherKey: 'courseId'
});


/**M:1 assocation between teacher and TeacherCourse */
StudentCourse.belongsTo(Course, {
    foreignKey: StudentCourseKeys.COURSE_ID
})

Course.hasMany(StudentCourse, {
    foreignKey: StudentCourseKeys.COURSE_ID
})


export { StudentCourse }