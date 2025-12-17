import { DataTypes, Model } from "sequelize"
import dayjs from "dayjs";

import { MaterialFiles as MaterialFilesAttr } from "@rkh-ms/classify-lib/interfaces"
import { MaterialFilesKeys, MaterialKeys } from "@rkh-ms/classify-lib/enums"

import { Material } from "./Material"
import { sequelize } from "../connect";


type MaterialFilesCreateAttrs = Omit<MaterialFilesAttr, MaterialFilesKeys.ID | 'version'>
class MaterialFiles extends Model<MaterialFilesAttr, MaterialFilesCreateAttrs> { }

MaterialFiles.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    materialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Material,
            key: MaterialKeys.ID
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    uploadAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    sequelize,
    tableName: 'materialsFiles',
    modelName: 'MaterialFiles',
    hooks: {
        beforeSave: (materialFile) => {
            if (dayjs(materialFile.dataValues.uploadAt).isAfter(dayjs()))
                throw new Error('file can\'nt be uploaded in the future')

            if (materialFile.changed() && !materialFile.isNewRecord)
                materialFile.setDataValue('version', materialFile.dataValues.version + 1)
        }
    }
})


/**M:1 assocation between material and file */
MaterialFiles.belongsTo(Material, {
    foreignKey: MaterialFilesKeys.MATERIAL_ID,
    onDelete: 'CASCADE'
})

Material.hasMany(MaterialFiles, {
    foreignKey: MaterialFilesKeys.MATERIAL_ID,
    onDelete: 'CASCADE'
});

export { MaterialFiles }