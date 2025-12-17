
import { body } from "express-validator";
import { SubjectKeys } from '@rkh-ms/classify-lib/enums'

/**middleware to validate subject object when receive request to add / update */
export const validateSubject = () => [
    body(SubjectKeys.HE)
        .notEmpty()
        .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
]