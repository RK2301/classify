import { body } from "express-validator";

export const managerValidate = () => [
    body('id')
        .isLength({ min: 9, max: 9 })
        .withMessage('ID must be 9-digit number'),
]