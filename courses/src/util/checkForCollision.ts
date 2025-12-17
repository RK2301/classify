import { Request } from "express"
import { Op, WhereOptions } from "sequelize"
import { Lesson as LessonAttrs } from "@rkh-ms/classify-lib/interfaces"
import { BadRequestError } from "@rkh-ms/classify-lib/errors"
import { Lesson } from "../models/Lesson"

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)
dayjs.extend(utc)

/**This function check whenever the lesson want to be added or updated collide with other lessons
 * 
 * if yes, then throw BadRequestError indiacting with which lesson, a collision found
 */
export const checkForCollision = async (
    /**for which course related the lesson to be added | updated */
    course_id: number,
    /**start time of the lesson as date object */
    lessonStartTime: Date,
    /**end time of the lesson as date object */
    lessonEndTime: Date,
    /**request object */
    req: Request,
    /**if passed then will assume that trying to update given lesson so will igonre his start/ end time when looking for collisions */
    lessonId?: number
) => {

    if (course_id < 1)
        throw Error('Invalid course id')

    let where: WhereOptions<LessonAttrs> = {
        course_id,
        [Op.or]: [{
            startTime: { [Op.lte]: lessonStartTime },
            endTime: { [Op.gt]: lessonStartTime }
        }, {
            startTime: { [Op.lt]: lessonEndTime },
            endTime: { [Op.gte]: lessonEndTime }
        }, {
            //  This for cases like: when have lesson start from 8:00 to 10:00
            //  and trying to add in the same day, from 6:00 to 12:00
            startTime: { [Op.gte]: lessonStartTime },
            endTime: { [Op.lte]: lessonEndTime }
        }],
    }

    /**if check for collision in update mode, then no need to look for collisions with 
     * the lesson itself
     */
    if (Number.isInteger(lessonId))
        where = {
            ...where,
            id: {
                [Op.not]: lessonId
            }
        }


    const collideLessons = await Lesson.findAll({
        where
    })

    if (collideLessons.length > 0)
        throw new BadRequestError(req.t('errors', 'LESSON_COLLIDE', {
            startTime: dayjs(collideLessons[0].dataValues.startTime).tz('Asia/Jerusalem').format('HH:mm'),
            endTime: dayjs(collideLessons[0].dataValues.endTime).tz('Asia/Jerusalem').format('HH:mm')
        }))
}