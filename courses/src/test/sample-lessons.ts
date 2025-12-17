import dayjs from "dayjs";
import { Lesson } from "@rkh-ms/classify-lib/interfaces";
import { LessonKeys, LessonStatus } from "@rkh-ms/classify-lib/enums";

type LessonCreate = Omit<Lesson, LessonKeys.ID | 'version'>

/**All lesson realted to course with id 1 */
export const course1Lessons: LessonCreate[] = [{
    course_id: 1,
    startTime: dayjs().subtract(1, "month").hour(9).minute(0).second(0).toDate(),
    endTime: dayjs().subtract(1, "month").hour(10).minute(0).second(0).toDate(),
    status: LessonStatus.COMPLETED,
},
{
    course_id: 1,
    startTime: dayjs().subtract(3, "weeks").hour(9).minute(0).toDate(),
    endTime: dayjs().subtract(3, "weeks").hour(10).minute(0).toDate(),
    status: LessonStatus.COMPLETED,
},
{
    course_id: 1,
    startTime: dayjs().subtract(2, "weeks").hour(9).minute(0).toDate(),
    endTime: dayjs().subtract(2, "weeks").hour(10).minute(0).toDate(),
    status: LessonStatus.COMPLETED,
},
{
    course_id: 1,
    startTime: dayjs().subtract(10, "days").hour(9).minute(0).toDate(),
    endTime: dayjs().subtract(10, "days").hour(10).minute(0).toDate(),
    status: LessonStatus.COMPLETED,
}]


// ---------- Course 2: Active course (has ongoing lesson) ----------
export const course2Lessons: LessonCreate[] = [
    {
        course_id: 2,
        startTime: dayjs().subtract(5, "days").hour(16).minute(0).toDate(),
        endTime: dayjs().subtract(5, "days").hour(17).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
    },
    {
        course_id: 2,
        startTime: dayjs().hour(0).add(0, "minute").subtract(5, "minutes").toDate(), // a bit in the past
        endTime: dayjs().add(50, "minutes").toDate(), // ends soon -> ONGOING
        status: LessonStatus.ONGOING,
    },
    {
        course_id: 2,
        startTime: dayjs().add(2, "days").hour(14).minute(0).toDate(),
        endTime: dayjs().add(2, "days").hour(15).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
    },
    {
        course_id: 2,
        startTime: dayjs().add(9, "days").hour(14).minute(0).toDate(),
        endTime: dayjs().add(9, "days").hour(15).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
    },
];



// ---------- Course 3: Future course (not yet started) ----------
export const course3Lessons: LessonCreate[] = [
    {
        course_id: 3,
        startTime: dayjs().add(10, "days").hour(10).minute(0).toDate(),
        endTime: dayjs().add(10, "days").hour(11).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
    },
    {
        course_id: 3,
        startTime: dayjs().add(17, "days").hour(10).minute(0).toDate(),
        endTime: dayjs().add(17, "days").hour(11).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
    },
    {
        course_id: 3,
        startTime: dayjs().add(24, "days").hour(10).minute(0).toDate(),
        endTime: dayjs().add(24, "days").hour(11).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,

    },
];


// ---------- Course 4: Mixed course (some completed, one canceled) ----------
export const course4Lessons: LessonCreate[] = [
    {
        course_id: 4,
        startTime: dayjs().subtract(20, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().subtract(20, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
    },
    {
        course_id: 4,
        startTime: dayjs().subtract(10, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().subtract(10, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
    },
    {
        course_id: 4,
        startTime: dayjs().add(3, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().add(3, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.CANCELLED,
    },
    {
        course_id: 4,
        startTime: dayjs().add(10, "days").hour(12).minute(0).toDate(),
        endTime: dayjs().add(10, "days").hour(13).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
    },
];



// ---------- Course 5: Short course happening today ----------
export const course5Lessons: LessonCreate[] = [
    {
        course_id: 5,
        startTime: dayjs().hour(9).minute(0).toDate(),
        endTime: dayjs().hour(10).minute(0).toDate(),
        status: dayjs().isAfter(dayjs().hour(10)) ? LessonStatus.COMPLETED
            : dayjs().isBefore(dayjs().hour(9)) ? LessonStatus.SCHEDULED : LessonStatus.ONGOING,
    },
    {
        course_id: 5,
        startTime: dayjs().hour(11).minute(0).toDate(),
        endTime: dayjs().hour(12).minute(0).toDate(),
        status: dayjs().isAfter(dayjs().hour(12)) ? LessonStatus.COMPLETED
            : dayjs().isBefore(dayjs().hour(11)) ? LessonStatus.SCHEDULED : LessonStatus.ONGOING,
    },
];



// ---------- Course 6: Active and ending soon ----------
export const course6Lessons: LessonCreate[] = [
    {
        course_id: 6,
        startTime: dayjs().subtract(7, "days").hour(15).minute(0).toDate(),
        endTime: dayjs().subtract(7, "days").hour(16).minute(0).toDate(),
        status: LessonStatus.COMPLETED,
    },
    {
        course_id: 6,
        startTime: dayjs().add(1, "days").hour(15).minute(0).toDate(),
        endTime: dayjs().add(1, "days").hour(16).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
    },
    {
        course_id: 6,
        startTime: dayjs().add(8, "days").hour(15).minute(0).toDate(),
        endTime: dayjs().add(8, "days").hour(16).minute(0).toDate(),
        status: LessonStatus.SCHEDULED,
    },
];



export const sampleLessons: LessonCreate[] = [
    ...course1Lessons,
    ...course2Lessons,
    ...course3Lessons,
    ...course4Lessons,
    ...course5Lessons,
    ...course6Lessons,
]


