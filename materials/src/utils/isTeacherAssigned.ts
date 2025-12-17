import { TeacherAssignedStatus, UserRole } from "@rkh-ms/classify-lib/enums"
import { TeacherCourse } from "../models/TeacherCourse"
import { ForbiddenError } from "@rkh-ms/classify-lib/errors"
import { Request } from "express"

/**if current client is teacher, check if he assigned to a specific course
 * 
 * That mean assigned and the status not set to unassigned
 * 
 * if teacher not assigned then error will be thrown says that not allowed
 * 
 * you can call this method when teacher try to add material or access it
 */
export const isTeacherAssigned = async (courseId: number, req: Request) => {


    if (req.currentUser!.role === UserRole.Teacher) {

        const isAssigned = await TeacherCourse.findOne({
            where: {
                courseId,
                teacherId: req.currentUser!.id,
                status: TeacherAssignedStatus.ASSIGNED
            }
        })

        if (!isAssigned)
            throw new ForbiddenError()

    }
}