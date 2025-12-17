import express, { Request, Response } from 'express'
import 'express-async-errors'

import { requireAuth, accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib'
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { NotFoundError } from '@rkh-ms/classify-lib/errors';

import { Subject } from '../models/subject'
import { SubjectDeletedPublisher } from '../rabbitMQ/publishers/SubjectDeletedPublisher'
import { validateSubjectId } from '../utils/validate-subjectId'

const router = express.Router()

router.delete('/api/subjects/:id',
    requireAuth,
    accessControlMiddleware(Actions.deleteAny, Resources.Subject),
    validateSubjectId(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. get the id from the url
        const id = Number(req.params.id)

        // 2. check if the subject exists
        const subject = await Subject.findByPk(id)
        if (!subject)
            throw new NotFoundError()

        // 3. delete the subject
        await subject.destroy()

        // 4. emit event to RabbitMQ
        new SubjectDeletedPublisher(rabbitMQ_Wrapper.channel).publish({
            id: subject.dataValues.id
        })

        // 5. respond with 204
        res.status(204).send()
    })

export { router as deleteSubjectRouter }