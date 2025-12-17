import { BadRequestError } from "@rkh-ms/classify-lib/errors";
import { body } from "express-validator";

export const teacherValidate = () => [
    body('startDate')
        .isISO8601()
        .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE'))
        .custom((value, { req }) => {
            if (new Date(value) > new Date())
                throw new BadRequestError(req.t('errors', 'FUTURE_DATE_NOT_ALLOWED'))
            return true
        }),
    body('endDate')
        .if(body('endDate').notEmpty())
        .isISO8601()
        .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE'))
        .custom((value, { req }) => {

            const startDate = req.body.startDate

            if (new Date(startDate) > new Date(value))
                throw new BadRequestError(req.t('errors', 'JOIN_DATE_CANNOT_BE_AFTER_LEAVE_DATE'))

            if (new Date(value) > new Date())
                throw new BadRequestError(req.t('errors', 'FUTURE_DATE_NOT_ALLOWED'))

            return true
        }),
    body('subjects')
        .not()
        .isEmpty()
        .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
        .isArray()
        .withMessage((value, { req }) => req.t('errors', 'INVALID_SUBJECTS_IDS'))
        .custom((value: any[], { req }) => {
            const allNumbers = value?.every(v => !!Number(v))

            // only number of id's allowed
            if (!allNumbers)
                throw new BadRequestError(req.t('errors', 'INVALID_SUBJECTS_IDS'))

            return true
        })
]