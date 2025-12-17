import express, { Request, Response } from 'express'
import 'express-async-errors'
import { param } from 'express-validator'

import { Actions, Resources } from '@rkh-ms/classify-lib'
import { accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares'
import { MaterialFiles } from '../models/MaterialFiles'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { isTeacherAssigned } from '../utils/isTeacherAssigned'
import { Material } from '../models/Material'
import { isStudentEnrolled } from '../utils/isStudentEnrolled'
import { bucket } from '../config/firebase'



const router = express.Router()

router.get('/api/materials/:materialId/files/:fileId/download',
    accessControlMiddleware([Actions.readAny, Actions.readOwn], Resources.MaterialFiles),
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

        // if student, make request then check if enrolled
        await isStudentEnrolled(material!.dataValues.courseId, req)


        // now make request to get a signed url to send it to the client
        // so client then can make request to get the file
        const bucketFile = bucket.file(file.dataValues.url)
        const [url] = await bucketFile.getSignedUrl({
            action: 'read',
            expires: Date.now() + (1 * 60 * 1000)   // 1 minutes, the link will be valid
        })

        //sent the url to the client
        res.json({ url })
    }
)

export { router as downloadFileRouter }