import dayjs from "dayjs";
import { Lesson } from "@rkh-ms/classify-lib/interfaces";
import { LessonStatus } from "@rkh-ms/classify-lib/enums";


/**All lesson realted to course with id 1 */
export const course1Lessons: Lesson[] = [{
    id: 1,
    course_id: 1,
    startTime: dayjs().subtract(1, "month").hour(9).minute(0).second(0).toDate(),
    endTime: dayjs().subtract(1, "month").hour(10).minute(0).second(0).toDate(),
    status: LessonStatus.COMPLETED,
    version: 1
},
{
    id: 2,
    course_id: 1,
    startTime: dayjs().subtract(3, "weeks").hour(9).minute(0).toDate(),
    endTime: dayjs().subtract(3, "weeks").hour(10).minute(0).toDate(),
    status: LessonStatus.COMPLETED,
    version: 1
},
{
    id: 3,
    course_id: 1,
    startTime: dayjs().subtract(2, "weeks").hour(9).minute(0).toDate(),
    endTime: dayjs().subtract(2, "weeks").hour(10).minute(0).toDate(),
    status: LessonStatus.COMPLETED,
    version: 1
},
{
    id: 4,
    course_id: 1,
    startTime: dayjs().subtract(10, "days").hour(9).minute(0).toDate(),
    endTime: dayjs().subtract(10, "days").hour(10).minute(0).toDate(),
    status: LessonStatus.COMPLETED,
    version: 1
}]


// ---------- Course 2: Active course (has ongoing lesson) ----------
export const course2Lessons: Lesson[] = [
    {
        id: 5,
        course_id: 2,
        startTime: dayjs().subtract(5, "days").hour(16).minute(0).toDate(),
        endTime: dayjs().subtract(5, "days").hour(17).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
        version: 1
    },
    {
        id: 6,
        course_id: 2,
        startTime: dayjs().hour(0).add(0, "minute").subtract(5, "minutes").toDate(), // a bit in the past
        endTime: dayjs().add(50, "minutes").toDate(), // ends soon -> ONGOING
        status: LessonStatus.ONGOING,
        version: 1
    },
    {
        id: 7,
        course_id: 2,
        startTime: dayjs().add(2, "days").hour(14).minute(0).toDate(),
        endTime: dayjs().add(2, "days").hour(15).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
    {
        id: 8,
        course_id: 2,
        startTime: dayjs().add(9, "days").hour(14).minute(0).toDate(),
        endTime: dayjs().add(9, "days").hour(15).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
];



// ---------- Course 3: Future course (not yet started) ----------
export const course3Lessons: Lesson[] = [
    {
        id: 9,
        course_id: 3,
        startTime: dayjs().add(10, "days").hour(10).minute(0).toDate(),
        endTime: dayjs().add(10, "days").hour(11).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
    {
        id: 10,
        course_id: 3,
        startTime: dayjs().add(17, "days").hour(10).minute(0).toDate(),
        endTime: dayjs().add(17, "days").hour(11).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
    {
        id: 11,
        course_id: 3,
        startTime: dayjs().add(24, "days").hour(10).minute(0).toDate(),
        endTime: dayjs().add(24, "days").hour(11).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
];


// ---------- Course 4: Mixed course (some completed, one canceled) ----------
export const course4Lessons: Lesson[] = [
    {
        id: 12,
        course_id: 4,
        startTime: dayjs().subtract(20, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().subtract(20, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
        version: 1
    },
    {
        id: 13,
        course_id: 4,
        startTime: dayjs().subtract(10, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().subtract(10, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
        version: 1
    },
    {
        id: 14,
        course_id: 4,
        startTime: dayjs().add(3, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().add(3, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.CANCELLED,
        version: 1
    },
    {
        id: 15,
        course_id: 4,
        startTime: dayjs().add(10, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().add(10, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
];



// ---------- Course 5: Short course happening today ----------
export const course5Lessons: Lesson[] = [
    {
        id: 16,
        course_id: 5,
        startTime: dayjs().hour(9).minute(0).toDate(),
        endTime: dayjs().hour(10).minute(0).toDate(),
        status: dayjs().isAfter(dayjs().hour(10)) ? LessonStatus.COMPLETED
            : dayjs().isBefore(dayjs().hour(9)) ? LessonStatus.SCHEDULED : LessonStatus.ONGOING,
        version: 1
    },
    {
        id: 17,
        course_id: 5,
        startTime: dayjs().hour(11).minute(0).toDate(),
        endTime: dayjs().hour(12).minute(0).toDate(),
        status: dayjs().isAfter(dayjs().hour(12)) ? LessonStatus.COMPLETED
            : dayjs().isBefore(dayjs().hour(11)) ? LessonStatus.SCHEDULED : LessonStatus.ONGOING,
        version: 1
    },
];



// ---------- Course 6: Active and ending soon ----------
export const course6Lessons: Lesson[] = [
    {
        id: 18,
        course_id: 6,
        startTime: dayjs().subtract(7, "days").hour(15).minute(0).toDate(),
        endTime: dayjs().subtract(7, "days").hour(16).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
        version: 1
    },
    {
        id: 19,
        course_id: 6,
        startTime: dayjs().add(1, "days").hour(15).minute(0).toDate(),
        endTime: dayjs().add(1, "days").hour(16).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
    {
        id: 20,
        course_id: 6,
        startTime: dayjs().add(8, "days").hour(15).minute(0).toDate(),
        endTime: dayjs().add(8, "days").hour(16).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
        version: 1
    },
];



export const sampleLessons: Lesson[] = [
    ...course1Lessons,
    ...course2Lessons,
    ...course3Lessons,
    ...course4Lessons,
    ...course5Lessons,
    ...course6Lessons,
]


