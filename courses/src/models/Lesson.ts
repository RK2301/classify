import { DataTypes, Model } from "sequelize";
import { Lesson as LessonAttrs } from "@rkh-ms/classify-lib/interfaces";
import { LessonKeys, LessonStatus } from "@rkh-ms/classify-lib/enums";
import { Course } from "./Course";
import { sequelize } from "../connect";


type LessonCreateAttrs = Omit<LessonAttrs, LessonKeys.ID | 'version'>

class Lesson extends Model<LessonAttrs, LessonCreateAttrs> { }

Lesson.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'lessons',
    modelName: 'Lesson',
    hooks: {
        beforeSave: (lesson) => {

            if (new Date(lesson.dataValues.endTime) < new Date(lesson.dataValues.startTime))
                throw new Error('Lesson can\'nt end before it start')

            if (lesson.changed() && !lesson.isNewRecord)
                lesson.setDataValue('version', lesson.dataValues.version + 1)
        }
    }
})

/**1:M association */
Course.hasMany(Lesson, {
    foreignKey: LessonKeys.COURSE_ID
})
Lesson.belongsTo(Course, {
    foreignKey: LessonKeys.COURSE_ID
});

export { Lesson }