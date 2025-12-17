import express, { Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'

import { Material } from '../models/Material'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { bucket } from '../config/firebase'
import { sequelize } from '../connect'
import { pathToMaterial } from '../utils/pathToMaterial'
import { MaterialFiles } from '../models/MaterialFiles'

const router = express.Router()

router.delete('/api/materials/:id',
    accessControlMiddleware([Actions.deleteAny, Actions.deleteOwn], Resources.Materials),
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const id = Number(req.params.id)

        // check if material exists
        const material = await Material.findByPk(id)
        if (!material)
            throw new NotFoundError()


        // if teacher, then check if assigned for the course
        await isTeacherAssigned(material!.dataValues.courseId, req)


        const transaction = await sequelize.transaction()
        try {

            // get refrence to material files from the storage
            const [files] = await bucket.getFiles({
                prefix: pathToMaterial(material.dataValues.courseId, id)
            })

            const materialFiles = await MaterialFiles.findAll({
                where: {
                    materialId: id
                }
            })

            // delete the material from the DB
            // by deleting the material all of it's files data will be deleted
            await material.destroy({ transaction })

            // make request to delete material files from the storage
            if (files.length > 0 && materialFiles.length > 0)
                await bucket.deleteFiles({ prefix: pathToMaterial(material.dataValues.courseId, id) })

            await transaction.commit()
            res.status(204).send()

        } catch (err) {
            console.error(err);
            await transaction.rollback()
            throw err
        }
    }
)

export { router as deleteMaterialRouter }