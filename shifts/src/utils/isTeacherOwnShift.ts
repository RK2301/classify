import { ForbiddenError } from "@rkh-ms/classify-lib/errors"
import { Shift } from "../models/shift"

/**This function check whenever teacher try to end/ delete the shift is really the owner of the shift
 ** note: this function does not check if the shift exists or not, it only checks if the teacher is the owner of the shift
 *
 * @throws {ForbiddenError} if the teacher is not the owner of the shift
 */
export const isTeacherOwnShift = async (teacherId: string, shiftId: number) => {

    const shift = await Shift.findByPk(shiftId)
    if (shift?.dataValues.teacherId !== teacherId)
        throw new ForbiddenError()
}