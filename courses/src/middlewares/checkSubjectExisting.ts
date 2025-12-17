import { NextFunction, Request, Response } from "express";
import 'express-async-errors'

import { RequestError } from "@rkh-ms/classify-lib/errors";
import { CourseKeys } from "@rkh-ms/classify-lib/enums";
import { Subject } from "../models/Subject";

/**This middleware check if subject based on it's id is exsists in the DB, before any 
 * add or update operations
 * 
 * if not found then response with 400 error 
 */
export const checkSubjectExsiting = async (req: Request, res: Response, next: NextFunction) => {

    const subjectId = req.body[CourseKeys.SUBJECT_ID]

    // 1. fetch the subject from the DB
    const subject = await Subject.findByPk(subjectId)
    if (!subject)
        throw new RequestError([{
            field: CourseKeys.SUBJECT_ID,
            message: req.t('errors', 'SUBJECT_NOT_EXISTS')
        }])

    // 2. subject found so continue to the next middleware
    next();
}