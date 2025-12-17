import { param } from "express-validator";

/**This function return a validation to validate the id params for request to update or delete a course
 * 
 * e.g. /api/courses/:id
 */
export const validateCourseId = () => [
    param('id')
        .isInt({ min: 0 })
        .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' }))
]