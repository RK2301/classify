import { LessonKeys, LessonStatus } from "@rkh-ms/classify-lib/enums";
import { Lesson } from "@rkh-ms/classify-lib/interfaces";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

type CreatedLesson = Omit<Lesson, LessonKeys.ID | LessonKeys.COURSE_ID | 'version'>

/**This function create a lesson for a course based on number of lessons, course start time &lessons times
 * 
 * last item in the array, have the last day in the course (end date)
 */
export const createLessons = (
    startDate: string,
    numberOfLessons: number,
    lessons: {
        day: number,
        startTime: string,
        endTime: string
    }[]): CreatedLesson[] => {

    // calculate number of weeks the course take to completed
    // based on lessons number and lessons per week.
    // +1 for number of weeks in case user want course first lesson
    // to be started before today day
    // e.g. today 15/9 Sun and want only one lesson on Mon
    // so adding one will enable us to move to next week to create that lesson
    const courseWeeks = Math.ceil(numberOfLessons / lessons.length) + 1
    const start = dayjs(startDate)
        .tz('Asia/Jerusalem')
        .startOf('day')

    let currentWeek = start

    const lessonsCreated: CreatedLesson[] = []

    // sort lessons based on day
    // so the last lesson will be the last day of the course
    lessons.sort((a, b) => a.day - b.day)

    for (let i = 0; i < courseWeeks; i++) {

        lessons.forEach(lesson => {

            //extract times when lesson start & end
            const [startHour, startMin] = lesson.startTime.split(':').map(time => Number(time))
            const [endHour, endMin] = lesson.endTime.split(':').map(time => Number(time))

            // when the lesson will take place
            const lessonDate = currentWeek.day(lesson.day)

            // set when lesson start and end
            const lessonStartTime = lessonDate
                .hour(startHour)
                .minute(startMin)


            const lessonEndTime = lessonDate
                .hour(endHour)
                .minute(endMin)


            // if the lesson will happened after the start date or same day
            // and number of lesson created less than the number of lesson must be 
            // created, then add the new lesson
            if (lessonDate >= start && lessonsCreated.length < numberOfLessons)
                lessonsCreated.push({
                    startTime: lessonStartTime.toDate(),
                    endTime: lessonEndTime.toDate(),

                    // decide lesson status based on the current time, to decide whenever
                    // completed, scheduled or ongoing
                    status: dayjs().isAfter(lessonEndTime) ? LessonStatus.COMPLETED :
                        dayjs().isBefore(lessonStartTime) ? LessonStatus.SCHEDULED : LessonStatus.ONGOING
                })
        })

        // add another week to create lessons for the next week
        currentWeek = currentWeek.add(1, 'week')
    }

    return lessonsCreated
}