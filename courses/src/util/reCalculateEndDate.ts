import { Transaction } from "sequelize";
import { Course } from "../models/Course";
import { Lesson } from "../models/Lesson";
import { LessonKeys } from "@rkh-ms/classify-lib/enums";

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)
dayjs.extend(utc)


/**This method update course end date after a request to update or delete specific lesson (if needed)
 * 
 * The function return boolean value indicate whenever the end date of the course updated.
 * 
 * case when end date for course will be updated:
 * 
 * course last lesson is at 18-9-2025 but user make request to delete it or updated it,
 * 
 * in this case must check if course end date must be changed to the last lesson date
*/
export const reCalculateEndDate = async (course: Course, transaction: Transaction) => {

    //  first fetch last lesson of the given course
    const lastLesson = (await Lesson.findAll({
        where: {
            course_id: course.dataValues.id
        },
        order: [[LessonKeys.END_TIME, 'DESC']],
        limit: 1,
        transaction
    }))[0]

    //  if difference found between course end date and last lesson end time, then update 
    //  course end date
    if (dayjs(course.dataValues.endDate).diff(dayjs(lastLesson.dataValues.endTime), 'day') !== 0)
        course!.set({
            endDate: dayjs(lastLesson.dataValues.endTime).tz('Asia/Jerusalem').format('YYYY-MM-DD')
        })

    // return true if course , need to be updated
    return course.changed()

}