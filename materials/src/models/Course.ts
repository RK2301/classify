import { DataTypes, Model } from "sequelize";
import { Course as CourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { CourseKeys } from "@rkh-ms/classify-lib/enums";

import { sequelize } from "../connect";



class Course extends Model<Omit<CourseAttrs, CourseKeys.SUBJECT_ID>> { }

Course.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    numberOfLessons: {
        type: DataTypes.SMALLINT,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'courses',
    modelName: 'Course'
})


export { Course }