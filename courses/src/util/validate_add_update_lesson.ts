import { body } from 'express-validator'
import dayjs from 'dayjs'
import customParseFormat from "dayjs/plugin/customParseFormat"
dayjs.extend(customParseFormat)

import { AddLessonRequestBody } from '../types/lessonRequestType'
import { TimeFormatRegExp } from '../util/timeFormatRegExp'
import { LessonKeys } from '@rkh-ms/classify-lib/enums'
import { BadRequestError } from '@rkh-ms/classify-lib/errors'


export const validateAddUpdateLesson = () => [
    body('date')
        .notEmpty()
        .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
        .isISO8601()
        .withMessage((value, { req }) => req.t('errors', 'NOT_VALID_DATE')),

    body(LessonKeys.START_TIME)
        .notEmpty()
        .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
        .matches(TimeFormatRegExp)
        .withMessage((value, { req }) => req.t('errors', 'INVALID_TIME_FORMAT')),
    body(LessonKeys.END_TIME)
        .notEmpty()
        .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
        .matches(TimeFormatRegExp)
        .withMessage((value, { req }) => req.t('errors', 'INVALID_TIME_FORMAT'))
        .custom((value: string, { req }) => {

            // check if end time before startTime
            // if yes then throw an error
            const startTime = (req.body as AddLessonRequestBody)[LessonKeys.START_TIME]
            const startFrom = dayjs(`2025-09-01 ${startTime}`, 'YYYY-MM-DD HH:mm')
            const endAt = dayjs(`2025-09-01 ${value}`, 'YYYY-MM-DD HH:mm')

            if (endAt.isBefore(startFrom))
                throw new BadRequestError(req.t('errors', 'INVALID_START_TIME_SHIFT'))

            return true
        })
]