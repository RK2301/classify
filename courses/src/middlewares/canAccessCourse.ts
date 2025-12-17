import { NextFunction, Request, Response } from "express";

import { UserRole } from "@rkh-ms/classify-lib";
import { ForbiddenError, NotFoundError } from "@rkh-ms/classify-lib/errors";
import { StundetEnrollmentStatus, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";
import { TeacherCourse } from "../models/TeacherCourse";
import { Course } from "../models/Course";
import { StudentCourse } from "../models/StudentCourse";


/**This middleware check whenever a student or teacher have access to specific course
 * 
 * This escpically for case of get request
 * 
 * the middleware get course id from params (/courses/:id)
 * 
 * e.g. courses/10 or lessons/10, mean trying access course data or course lessons
 * 
 * * also the middleware make sure the course that want to access by teacher or student is indeed exists
 */
export const CanAccessCourse = async (req: Request, res: Response, next: NextFunction) => {


    // This middleware first check's if requested course exists
    // then check's if student enrolled for the given course
    // or check's if teacher assigned to the course
    const courseId = Number(req.params.id)

    const course = await Course.findByPk(courseId)
    if (!course)
        throw new NotFoundError()

    // if studnet check's if enrolled
    if (req.currentUser!.role === UserRole.Student) {
        const isStundetEnrolled = await StudentCourse.findOne({
            where: {
                courseId: courseId,
                studentId: req.currentUser!.id,
                status: StundetEnrollmentStatus.ACTIVE
            }
        })

        if (!isStundetEnrolled)
            throw new ForbiddenError()
    }


    // if teacher make the request then check's if assigned
    if (req.currentUser!.role === UserRole.Teacher) {
        const isTeacherAssigned = await TeacherCourse.findOne({
            where: {
                courseId,
                teacherId: req.currentUser!.id,
                status: TeacherAssignedStatus.ASSIGNED
            }
        })

        if (!isTeacherAssigned)
            throw new ForbiddenError()
    }

    // if got here, mean user is manager or has access to the course data
    next()
}