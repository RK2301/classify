import { DataTypes, Model } from "sequelize";

import { sequelize } from "../connect";
import { Subject as SubjectAttrs } from '@rkh-ms/classify-lib/interfaces'


class Subject extends Model<SubjectAttrs> { };

Subject.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    he: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    ar: {
        type: DataTypes.STRING,
        unique: true
    },
    en: {
        type: DataTypes.STRING,
        unique: true
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'subjects',
    modelName: 'Subject'
})

export { Subject }