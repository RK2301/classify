import { UserRole } from "@rkh-ms/classify-lib"
import { Request } from "express"

import { StudentCourse } from "../models/StudentCourse"
import { ForbiddenError } from "@rkh-ms/classify-lib/errors"
import { StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums"

/**if current client is student, check if he enrolled to a specific course
 * 
 * 
 * if student not enrolled then error will be thrown says that not allowed
 * 
 * you can call this method when student try to access materials/ or files for specific course
 */
export const isStudentEnrolled = async (courseId: number, req: Request) => {

    if (req.currentUser!.role === UserRole.Student) {

        const enrolled = await StudentCourse.findOne({
            where: {
                courseId,
                studentId: req.currentUser!.id,
                status: StundetEnrollmentStatus.ACTIVE
            }
        })
        if (!enrolled)
            throw new ForbiddenError()

    }
}