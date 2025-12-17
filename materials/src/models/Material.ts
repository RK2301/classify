import { DataTypes, Model } from "sequelize";
import { Material as MaterialAttrs } from "@rkh-ms/classify-lib/interfaces";
import { Course } from "./Course";
import { CourseKeys, MaterialKeys } from "@rkh-ms/classify-lib/enums";

import { sequelize } from "../connect";
import dayjs from "dayjs";

type MaterialCreateAttrs = Omit<MaterialAttrs, MaterialKeys.ID | 'version'>
class Material extends Model<MaterialAttrs, MaterialCreateAttrs> { }


Material.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Course,
            key: CourseKeys.ID
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    uploadAt: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'materials',
    modelName: 'Material',
    hooks: {
        beforeSave: (material) => {
            if (dayjs(material.dataValues.uploadAt).isAfter(dayjs()))
                throw new Error('Material can\'nt be uploaded in the future')

            if (material.changed() && !material.isNewRecord)
                material.setDataValue('version', material.dataValues.version + 1)
        }
    }
})


/**M:1 assocation between material and course */
Material.belongsTo(Course, {
    foreignKey: MaterialKeys.COURSE_ID,
    onDelete: 'CASCADE'
})

Course.hasMany(Material, {
    foreignKey: MaterialKeys.COURSE_ID,
    onDelete: 'CASCADE'
});

export { Material }