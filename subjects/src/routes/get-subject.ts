// route to get specific subjects
import express, { Request, Response } from 'express'
import 'express-async-errors'

import { requireAuth, accessControlMiddleware, validateRequest } from '@rkh-ms/classify-lib/middlewares';
import { Resources, Actions } from '@rkh-ms/classify-lib/accesscontrol'
import { NotFoundError } from '@rkh-ms/classify-lib/errors';

import { Subject } from '../models/subject'
import { validateSubjectId } from '../utils/validate-subjectId'


const router = express.Router()

//This route can be used from manager when want subject data before update it
router.get('/api/subjects/:id',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Subject),
    validateSubjectId(),
    validateRequest,
    async (req: Request, res: Response) => {

        // 1. get subject id from the params object
        const subjectId = Number(req.params.id)

        // 2. get the subject from the db
        const subject = await Subject.findByPk(subjectId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'version']
            }
        })

        if (!subject)
            throw new NotFoundError()

        res.json(subject)
    })

export { router as getSubjectRouter }