import { query } from "express-validator";

export const studentSortingQueryValidator = () => [
    query('sort').optional().isInt({ min: 1, max: 6 }).withMessage((value, { req }) =>
        req.t('errors', 'BETWEEN', { key: 'sort', min: 1, max: 3 })),
    query('orderDir').optional().isIn(['ASC', 'DESC']).withMessage((value, { req }) =>
        req.t('errors', 'ONE_OF', { key: 'orderDir', values: 'ASC, DESC' }))
]