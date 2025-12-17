import { body, check } from "express-validator";

export const userValidate = () => [
    body('id')
        .isLength({ min: 9, max: 9 })
        .withMessage('ID must be a 9-digit number'),
    body('firstName')
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    check('email')
        .if(body('email').notEmpty())
        .isEmail()
        .withMessage('Provide valid email'),
    check('phone')
        .if(body('phone').notEmpty())
        .isMobilePhone('he-IL')
        .withMessage('Please provide valid phone number'),
]