// route to get all subjects
import express from 'express'
import 'express-async-errors'
import { Op } from 'sequelize'

import { requireAuth, accessControlMiddleware } from '@rkh-ms/classify-lib/middlewares';
import { Resources, Actions } from '@rkh-ms/classify-lib/accesscontrol'
import { Subject } from '../models/subject'


const router = express.Router()

router.get('/api/subjects',
    requireAuth,
    accessControlMiddleware(Actions.readAny, Resources.Subject),
    async (req, res) => {

        // 1. support search by name in any language
        const name = req.query.search ? String(req.query.search).trim().replace(' ', '%') : null


        // 2. get all subjects from the db
        const subjects = await Subject.findAll({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'version']
            },
            where: name ? {
                [Op.or]: [
                    { ar: { [Op.like]: `%${name}%` } },
                    { he: { [Op.like]: `%${name}%` } },
                    { en: { [Op.like]: `%${name}%` } }
                ]
            } : undefined
        })

        res.json(subjects)
    })

export { router as getSubjectsRouter }