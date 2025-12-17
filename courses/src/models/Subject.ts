import { DataTypes, Model } from "sequelize";
import { Subject as SubjectAttrs } from "@rkh-ms/classify-lib/interfaces";
import { sequelize } from "../connect";

class Subject extends Model<SubjectAttrs> { }

Subject.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    he: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ar: {
        type: DataTypes.STRING
    },
    en: {
        type: DataTypes.STRING
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