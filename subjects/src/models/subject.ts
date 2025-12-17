import { DataTypes, Model } from "sequelize";
import { Subject as SubjectAttributes } from "@rkh-ms/classify-lib/interfaces";
import { sequelize } from "../connect";

interface SubjectCreationAttributes extends Omit<SubjectAttributes, 'id' | 'version'> { }

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> {
}

Subject.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'subjects',
    modelName: 'Subject',
    hooks: {
        beforeUpdate: (subject) => {
            if (subject.changed())
                subject.setDataValue('version', subject.dataValues.version + 1);
        }
    }
})

export { Subject }