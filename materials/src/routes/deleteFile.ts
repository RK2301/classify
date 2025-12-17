import express, { Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'

import { MaterialFiles } from '../models/MaterialFiles'
import { Material } from '../models/Material'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { bucket } from '../config/firebase'
import { sequelize } from '../connect'

const router = express.Router()

router.delete('/api/materials/:materialId/files/:fileId',
    accessControlMiddleware([Actions.deleteAny, Actions.deleteOwn], Resources.MaterialFiles),
    [
        param('materialId')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),
        param('fileId')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const materialId = Number(req.params.materialId)
        const fileId = Number(req.params.fileId)

        // check if file exists
        const file = await MaterialFiles.findOne({
            where: {
                id: fileId,
                materialId
            }
        })
        if (!file)
            throw new NotFoundError()

        // fetch the material (if file found, then of course the material exists)
        const material = await Material.findByPk(materialId)

        // if teacher, then check if assigned for the course
        await isTeacherAssigned(material!.dataValues.courseId, req)

        const transaction = await sequelize.transaction()
        try {

            const fileURL = file.dataValues.url

            // delete the file from the DB
            await file.destroy({ transaction })

            // make request to delete the file from the storage
            const bucketFile = bucket.file(fileURL)
            await bucketFile.delete()

            await transaction.commit()
            res.status(204).send()

        } catch (err) {
            console.error(err);
            await transaction.rollback()
            throw err
        }
    }
)

export { router as deleteFileRouter }