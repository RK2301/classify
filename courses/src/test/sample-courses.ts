import { CourseKeys } from "@rkh-ms/classify-lib/enums";
import { Course } from "@rkh-ms/classify-lib/interfaces";
import { course1Lessons, course2Lessons, course3Lessons, course4Lessons, course5Lessons, course6Lessons } from "./sample-lessons";
import dayjs from "dayjs";

// ---------- Helper: generate readable ISO dates ----------
const iso = (d: dayjs.Dayjs) => d.toISOString();

export const sampleCourses: Omit<Course, 'version'>[] = [{
    id: 1,
    title: "Foundations of Classification (past)",
    numberOfLessons: course1Lessons.length,
    startDate: iso(dayjs(course1Lessons[0].startTime)),
    endDate: iso(dayjs(course1Lessons[course1Lessons.length - 1].endTime)),
    subjectId: 1,
}, {
    id: 2,
    title: "Realtime Practices (active)",
    numberOfLessons: course2Lessons.length,
    startDate: iso(dayjs(course2Lessons[0].startTime)),
    endDate: iso(dayjs(course2Lessons[course2Lessons.length - 1].endTime)),
    subjectId: 2,
}, {
    id: 3,
    title: "Advanced Scheduling (future)",
    numberOfLessons: course3Lessons.length,
    startDate: iso(dayjs(course3Lessons[0].startTime)),
    endDate: iso(dayjs(course3Lessons[course3Lessons.length - 1].endTime)),
    subjectId: 3,
}, {
    id: 4,
    title: "Exception Handling in Lessons",
    numberOfLessons: course4Lessons.length,
    startDate: iso(dayjs(course4Lessons[0].startTime)),
    endDate: iso(dayjs(course4Lessons[course4Lessons.length - 1].endTime)),
    subjectId: 1,
}, {
    id: 5,
    title: "One-Day Workshop",
    numberOfLessons: course5Lessons.length,
    startDate: iso(dayjs(course5Lessons[0].startTime)),
    endDate: iso(dayjs(course5Lessons[course5Lessons.length - 1].endTime)),
    subjectId: 2,
}, {
    id: 6,
    title: "Short Series (ending soon)",
    numberOfLessons: course6Lessons.length,
    startDate: iso(dayjs(course6Lessons[0].startTime)),
    endDate: iso(dayjs(course6Lessons[course6Lessons.length - 1].endTime)),
    subjectId: 1,
}]