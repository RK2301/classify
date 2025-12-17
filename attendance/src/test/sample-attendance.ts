import { AttendanceStatus, LessonStatus } from "@rkh-ms/classify-lib/enums";
import { sampleLessons } from "./sample-lessons";
import { sampleEnrollStudents } from "./sample-enrolled-students";
import { Attendance } from "@rkh-ms/classify-lib/interfaces";

const status = [AttendanceStatus.Attend, AttendanceStatus.Absent, AttendanceStatus.Late]


export const sampleAttendance = sampleLessons.filter(l => l.status === LessonStatus.COMPLETED ||
    l.status === LessonStatus.ONGOING)
    .reduce<Attendance[]>((attendances, l) => {

        // get all student enrolled for the course
        const enrolledStudents = sampleEnrollStudents.filter(s => s.courseId === l.course_id)

        // give attendance for all stundets enrolled except one (num students enrolled - 1)
        const toGiveAttendance = enrolledStudents.length < 2 ? enrolledStudents :
            enrolledStudents.slice(0, enrolledStudents.length - 1)

        toGiveAttendance.forEach((s, index) => attendances.push({
            lessonId: l.id,
            studentId: s.studentId,
            status: status[index % status.length],
            reportedAt: new Date(),
            version: 1
        }))

        return attendances
    }, [])