import { DataTypes, Model } from "sequelize";
import dayjs from "dayjs";

import { TeacherCourse as TeacherCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { CourseKeys, TeacherAssignedStatus, TeacherCourseKeys } from "@rkh-ms/classify-lib/enums";
import { sequelize } from "../connect";
import { Course } from "./Course";
import { Teacher } from "./Teacher";

type TeacherCourseCreateAttrs = Omit<TeacherCourseAttrs, TeacherCourseKeys.UNASSIGNED_AT | TeacherCourseKeys.STATUS | 'version'>

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
        primaryKey: true,
        references: {
            model: Teacher,
            key: 'id'
        }
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
        allowNull: false,
        defaultValue: TeacherAssignedStatus.ASSIGNED
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'teachers_courses',
    modelName: 'TeacherCourse',
    hooks: {
        beforeSave: (teacherCourse) => {

            if (dayjs(teacherCourse.dataValues.assigned_at).format('DD/MM/YYYY') !== dayjs().format('DD/MM/YYYY'))
                throw new Error('Teacher can\'nt be assigned to a course in the past')

            if (teacherCourse.dataValues.unAssigned_at &&
                new Date(teacherCourse.dataValues.unAssigned_at) < new Date(teacherCourse.dataValues.assigned_at)
            )
                throw new Error("Teacher can't be un assigned from a course before he really assigned to it")

            if (teacherCourse.changed() && !teacherCourse.isNewRecord)
                teacherCourse.setDataValue('version', teacherCourse.dataValues.version + 1)
        }
    }
})

/**M:N assocation between teachers and courses */
Course.belongsToMany(Teacher, {
    through: TeacherCourse,
    foreignKey: 'courseId',
    otherKey: 'teacherId'
});

Teacher.belongsToMany(Course, {
    through: TeacherCourse,
    foreignKey: 'teacherId',
    otherKey: 'courseId'
});


/** 1:M assocation between teacher and teacher_course table */
TeacherCourse.belongsTo(Teacher, {
    foreignKey: 'teacherId'
});


Teacher.hasMany(TeacherCourse, {
    foreignKey: 'teacherId'
});


/**M:1 assocation between teacher and TeacherCourse */
TeacherCourse.belongsTo(Course, {
    foreignKey: TeacherCourseKeys.COURSE_ID
})

Course.hasMany(TeacherCourse, {
    foreignKey: TeacherCourseKeys.COURSE_ID
})

export { TeacherCourse }