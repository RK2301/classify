import { param } from "express-validator";

/**this middleware to validate a subject id params passed to the request 
 * 
 * e.g. update request or delete request, where the subject id is passed as a url param
 */
export const validateSubjectId = () => [
    param('id')
        .isInt({ gt: 0 })
        .withMessage((value, { req }) => req.t('errors', 'ONLY_NUMBERS'))
]