import { query } from "express-validator";
import { Sort } from "@rkh-ms/classify-lib/enums";


/**This middleware validate the sort query params which are sort & sortDir
 * 
 * sort can be any integer between 1 to max
 * 
 * sortDir can be either ASC or DESC
 * @param max maximum value for sort, min is always 1
 */
export const sortValidation = (max: number = 6) => [
    query('sort')
        .optional({ values: 'null' })
        .isInt({ min: 1, max })
        .withMessage((value, { req }) =>
            req.t('errors', 'BETWEEN', { key: 'sort', min: 1, max })),

    query('sortDir')
        .optional({ values: 'null' })
        .isIn([Sort.ASC, Sort.DESC])
        .withMessage((value, { req }) =>
            req.t('errors', 'ONE_OF', { key: 'orderDir', values: 'ASC, DESC' }))
]