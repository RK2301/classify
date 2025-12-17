import express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'
import { body, param } from 'express-validator'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { BadRequestError, NotFoundError } from '@rkh-ms/classify-lib/errors'
import { MaterialKeys } from '@rkh-ms/classify-lib/enums'
import { Material as MaterialAttrs } from '@rkh-ms/classify-lib/interfaces'


import { upload } from '../config/multer'
import { Material } from '../models/Material'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { sequelize } from '../connect'
import { uploadToFirebase } from '../utils/uploadToFirebase'
import { MaterialFiles } from '../models/MaterialFiles'


const router = express.Router()

export type UpdateMaterialRequestBody = Pick<MaterialAttrs, MaterialKeys.TITLE | MaterialKeys.DESCRIPTION>

router.patch('/api/materials/:id',
    accessControlMiddleware([Actions.updateAny, Actions.updateOwn], Resources.Materials),
    upload.array('files'),
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {

        if (!req.files || req.files.length === 0)
            return next()

        const id = Number(req.params.id)
        const files = req.files as Express.Multer.File[]

        // check if material exists
        const material = await Material.findByPk(id)
        if (!material)
            throw new NotFoundError()

        //  if the client is teacher, then check if assigned to the course
        await isTeacherAssigned(material.dataValues.courseId, req)

        const transaction = await sequelize.transaction()
        try {

            //  upload the files  
            const filesPaths = await Promise.all(files.map(file =>
                uploadToFirebase(file, material.dataValues.courseId, material.dataValues.id)))


            // insert files data to the DB
            const materialFiles = await MaterialFiles.bulkCreate(files.map((file, index) => ({
                materialId: material.dataValues.id,
                name: file.originalname,
                type: file.mimetype,
                url: filesPaths[index],
                uploadAt: new Date()
            })), { transaction })

            await transaction.commit()
            res.status(201).send(materialFiles.map(file => ({
                id: file.dataValues.id,
                materialId: file.dataValues.materialId,
                name: file.dataValues.name,
                type: file.dataValues.type
            })))

        } catch (err) {
            console.error(err);
            transaction.rollback()
            throw err
        }
    },
    [
        body(MaterialKeys.TITLE)
            .optional()
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isLength({ min: 1, max: 200 })
            .withMessage((value, { req }) => req.t('errors', 'BETWEEN', {
                key: '',
                min: 1,
                max: 200
            })),
        body(MaterialKeys.DESCRIPTION)
            .optional({
                values: 'null'
            })
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isLength({ min: 1, max: 200 })
            .withMessage((value, { req }) => req.t('errors', 'BETWEEN', {
                key: '',
                min: 1,
                max: 200
            }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const { title, description } = req.body as UpdateMaterialRequestBody

        //  1. To update the material then must pass at least the description or title to update
        if (!title && !description)
            throw new BadRequestError('Must pass title or description at least')


        //  2. check if material exists
        const id = Number(req.params.id)

        const material = await Material.findByPk(id)
        if (!material)
            throw new NotFoundError()

        //  3. if the client is teacher, then check if assigned to the course
        await isTeacherAssigned(material.dataValues.courseId, req)

        //  4. update the material

        // if title not passed and set it value to undefined
        // that will set it in the query to null
        // will cause error as title can't be null
        if (title)
            material.set({
                [MaterialKeys.TITLE]: title
            })

        // description is optinal, so when it's value as undefined
        // when set to null in the update query
        // unless in the request description passed as null
        material.set({
            [MaterialKeys.DESCRIPTION]: description
        })

        await material.save()

        res.json(material)
    }
)


export { router as updateMaterialRouter }