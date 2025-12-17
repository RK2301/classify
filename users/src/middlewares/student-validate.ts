import { body, check } from "express-validator";

export const studentValidate = () => [
    body('grade')
        .isInt({ min: 1, max: 13 })
        .withMessage('Grade is required and must be between 1 to 13'),
    check('motherPhone')
        .if(body('motherPhone').notEmpty())
        .isMobilePhone('he-IL')
        .withMessage('Please provide valid phone number'),
    check('fatherPhone')
        .if(body('fatherPhone').notEmpty())
        .isMobilePhone('he-IL')
        .withMessage('Please provide valid phone number'),
]

