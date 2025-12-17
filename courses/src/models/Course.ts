import { DataTypes, Model } from "sequelize";
import { Course as CourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { BadRequestError } from "@rkh-ms/classify-lib/errors";
import { CourseKeys } from "@rkh-ms/classify-lib/enums";

import { Subject } from "./Subject";
import { sequelize } from "../connect";


type CourseCreateAttrs = Omit<CourseAttrs, CourseKeys.ID | 'version'>

class Course extends Model<CourseAttrs, CourseCreateAttrs> { }

Course.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    numberOfLessons: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Subject,
            key: 'id'
        }
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'courses',
    modelName: 'Course',
    hooks: {
        beforeSave: (course) => {
            // check if end date is after start date
            if (new Date(course.dataValues.startDate) > new Date(course.dataValues.endDate))
                throw new BadRequestError('Start Date should be before End Date')

            if (course.changed() && !course.isNewRecord)
                course.setDataValue('version', course.dataValues.version + 1)
        }
    }
})

Subject.hasMany(Course, {
    foreignKey: {
        name: CourseKeys.SUBJECT_ID,
        allowNull: true
    },
    onDelete: 'SET NULL',
    hooks: true
});

Course.belongsTo(Subject, {
    foreignKey: {
        name: CourseKeys.SUBJECT_ID,
        allowNull: true
    },
    onDelete: 'SET NULL',
    hooks: true
});



export { Course }