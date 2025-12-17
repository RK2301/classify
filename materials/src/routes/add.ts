import express, { Request, Response } from 'express'
import 'express-async-errors'
import { body } from 'express-validator'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { Material as MaterialAttrs } from '@rkh-ms/classify-lib/interfaces'
import { MaterialKeys } from '@rkh-ms/classify-lib/enums'
import { NotFoundError, RequestError } from '@rkh-ms/classify-lib/errors'

import { upload } from '../config/multer'
import { Course } from '../models/Course'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { sequelize } from '../connect'
import { Material } from '../models/Material'
import dayjs from 'dayjs'
import { uploadToFirebase } from '../utils/uploadToFirebase'
import { MaterialFiles } from '../models/MaterialFiles'


const router = express.Router()

/**Represent request body for a add material request */
export type AddMaterialRequestBody = Pick<MaterialAttrs, MaterialKeys.TITLE | MaterialKeys.DESCRIPTION | MaterialKeys.COURSE_ID>

router.post("/api/materials",
    accessControlMiddleware([Actions.createAny, Actions.createOwn], Resources.Materials),
    upload.array('files'),
    [
        body(MaterialKeys.TITLE)
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isLength({ min: 1, max: 50 })
            .withMessage((value, { req }) => req.t('errors', 'BETWEEN', {
                key: '',
                min: 1,
                max: 50
            })),
        body(MaterialKeys.DESCRIPTION)
            .optional()
            .notEmpty()
            .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
            .isLength({ min: 1, max: 300 })
            .withMessage((value, { req }) => req.t('errors', 'BETWEEN', {
                key: '',
                min: 1,
                max: 300
            })),
        body(MaterialKeys.COURSE_ID)
            .isInt({ min: 0 })
            .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
    ],
    validateRequest,
    async (req: Request, res: Response) => {

        const { courseId, title, description } = req.body as AddMaterialRequestBody

        // check if files passed
        const files = req.files as Express.Multer.File[]
        if (!files || files.length === 0)
            throw new RequestError([{
                field: 'files',
                message: req.t('errors', 'REQUIRED')
            }])

        //  1. check if course exists
        const course = await Course.findByPk(courseId)
        if (!course)
            throw new NotFoundError()

        //  2. if the client is teacher, then check if assigned to the course
        await isTeacherAssigned(courseId, req)


        //  3. create material and then upload the files
        const transaction = await sequelize.transaction()
        try {

            //  create a material
            const material = await Material.create({
                courseId,
                title,
                description,
                uploadAt: dayjs().format('YYYY-MM-DD')
            }, { transaction })

            //  upload the files  
            const filesPaths = await Promise.all(files.map(file =>
                uploadToFirebase(file, courseId, material.dataValues.id)))

            // insert files data to the DB
            await MaterialFiles.bulkCreate(files.map((file, index) => ({
                materialId: material.dataValues.id,
                name: file.originalname,
                type: file.mimetype,
                url: filesPaths[index],
                uploadAt: new Date()
            })), { transaction })

            await transaction.commit()
            res.status(201).json(material)

        } catch (err) {
            console.error(err);
            transaction.rollback()
            throw err
        }
    }
)

export { router as addMaterialRouter }