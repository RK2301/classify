import { query } from "express-validator";

/**
 * This function validates the query parameters for pagination
 * * it's validate the page and limit query parameters
 * * page must be a positive number
 * * limit must be a number between 1 and 100
 */
export const pageingQueryValidator = () => [
    query('page').optional().isInt({ min: 1 }).withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: 'page' })),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage((value, { req }) => req.t('errors', 'BETWEEN', { key: 'limit', min: 1, max: 50 })),
]
// as unknown as express.RequestHandler[],