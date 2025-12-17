import express, { Request, Response } from 'express';
import 'express-async-errors'
import { UniqueConstraintError } from 'sequelize';

import { requireAuth, accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib';
import { Actions, Resources } from '@rkh-ms/classify-lib/accesscontrol'
import { RequestError } from '@rkh-ms/classify-lib/errors';

import { Subject } from '../models/subject';
import { SubjectCreatedPublisher } from '../rabbitMQ/publishers/SubjectCreatedPublisher';
import { validateSubject } from '../utils/validate-subject';

const router = express.Router()

router.post('/api/subjects',
    requireAuth,
    accessControlMiddleware(Actions.createAny, Resources.Subject),
    validateSubject(),
    validateRequest,
    async (req: Request, res: Response) => {

        const { he, ar, en } = req.body

        //create subject and catch unique constraint error
        try {
            const subject = await Subject.create({ he, ar, en })

            // emit event to RabbitMQ
            new SubjectCreatedPublisher(rabbitMQ_Wrapper.channel).publish(subject.dataValues)

            res.status(201).json(subject)
        } catch (err) {
            if (err instanceof UniqueConstraintError)
                throw new RequestError([{
                    message: req.t('errors', 'SUBJECT_DUPLICATE_NAME'),
                    field: err.errors[0].path!
                }])

            throw err
        }
    }
)

export { router as addSubjectRouter }