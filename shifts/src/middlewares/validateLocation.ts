import { body } from "express-validator";

/**This middleware validate the start or end location for the incoming request */
export const validateLocation = (field: 'startLocation' | 'endLocation') => [
    body(field)
        .exists()
        .withMessage((value, { req }) =>
            req.t('errors', 'PROVIDE_LOCATION'))
        .isArray({ min: 2, max: 2 })
        .withMessage((value, { req }) => req.t('errors', 'INVALID_LOCATION')),
    body(`${field}.*`)
        .isFloat()
        .withMessage((value, { req }) => req.t('errors', 'INVALID_LOCATION'))
]