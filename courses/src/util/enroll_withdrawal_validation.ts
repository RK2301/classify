import { StudentCourseKeys } from "@rkh-ms/classify-lib/enums";
import { body } from "express-validator";

/**This function return a validation chain to validate request body, for both enroll or withdrawal requests
 * 
 * the validation checks courseId and studentId values if correct
 */
export const enrollWithdrawalValidation = () => [
    body(StudentCourseKeys.COURSE_ID)
        .isInt({ min: 1 })
        .withMessage((value, { req }) => req.t('errors', 'POSITIVE', { key: '' })),

    body(StudentCourseKeys.STUDENT_ID)
        .notEmpty()
        .withMessage((value, { req }) => req.t('errors', 'REQUIRED'))
        .matches(/^[0-9]{7,9}$/)
        .withMessage((value, { req }) => req.t('errors', 'NO_STUDENT_WITH_SUCH_ID', { id: value }))
]