import { NextFunction, Request, Response } from "express";
import 'express-async-errors'

import { BadRequestError } from "@rkh-ms/classify-lib/errors";
import { Teacher } from "../models/Teacher";
import { Op } from "sequelize";

/**This middleware checks if teachers to be assigned to a course are exists in the DB
 * 
 * if one of the teachers not exists then error 400 will be sent back
 */
export const checkTeacherExisting = async (req: Request, res: Response, next: NextFunction) => {

    const teachers = req.body.teachers as string[]

    // check in the DB all teachers provided exists
    const exsists_teachers = await Teacher.findAll({
        where: {
            id: {
                [Op.in]: teachers
            }
        }
    })

    // if teacher from the DB not same number of the given one
    // then one or more, of the provided teacher'd id not found
    if (exsists_teachers.length !== teachers.length) {
        const unexistsTeacher = teachers.find(teacher => !exsists_teachers.find(exists_teacher =>
            exists_teacher.dataValues.id === teacher))

        // a teacher not exists
        if (unexistsTeacher)
            throw new BadRequestError(req.t('errors', 'NO_TEACHER_WITH_SUCH_ID', {
                id: unexistsTeacher
            }))
    }

    next()
}