import { DataTypes, Model } from "sequelize";
import { Lesson as LessonAttrs } from "@rkh-ms/classify-lib/interfaces";
import { LessonStatus } from "@rkh-ms/classify-lib/enums";
import { sequelize } from "../connect";


class Lesson extends Model<LessonAttrs> { }

Lesson.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM(LessonStatus.SCHEDULED, LessonStatus.ONGOING, LessonStatus.COMPLETED, LessonStatus.CANCELLED),
        allowNull: false,
        defaultValue: LessonStatus.SCHEDULED
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'lessons',
    modelName: 'Lesson'
})



export { Lesson }