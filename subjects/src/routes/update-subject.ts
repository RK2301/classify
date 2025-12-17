import express, { Request, Response } from 'express'
import 'express-async-errors'
import { UniqueConstraintError } from 'sequelize'

import { requireAuth, accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib'
import { Resources, Actions } from '@rkh-ms/classify-lib/accesscontrol'
import { NotFoundError, RequestError } from '@rkh-ms/classify-lib/errors';

import { Subject } from '../models/subject'
import { SubjectUpdatedPublisher } from '../rabbitMQ/publishers/SubjectUpdatedPublisher'
import { validateSubjectId } from '../utils/validate-subjectId'
import { validateSubject } from '../utils/validate-subject'

const router = express.Router()

router.put('/api/subjects/:id',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Subject),
    validateSubjectId(),
    validateSubject(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. get the id from the url
        const id = Number(req.params.id)

        // 2. get the data from the body
        const { he, ar, en } = req.body

        // 3. check if the subject exists
        // if not, throw a 404 error
        const subject = await Subject.findByPk(id)
        if (!subject)
            throw new NotFoundError()

        // 4. update the subject
        try {
            subject.set({ he, ar, en })
            await subject.save()

            // 5. emit event to RabbitMQ
            new SubjectUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(subject.dataValues)

            // 6. respond with the updated subject
            res.status(200).json(subject)
        } catch (err) {

            //check if the error is a unique constraint error
            if (err instanceof UniqueConstraintError)
                throw new RequestError([{
                    field: err.errors[0].path!,
                    message: req.t('errors', 'SUBJECT_DUPLICATE_NAME')
                }])

            throw err

        }
    })

export { router as updateSubjectRouter }