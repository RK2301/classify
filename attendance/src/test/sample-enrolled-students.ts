import { StudentCourseKeys, StundetEnrollmentStatus } from "@rkh-ms/classify-lib/enums"
import { sampleStudents } from "./sample-students"
import { sampleCourses } from "./sample-courses"
import { StudentCourse } from "@rkh-ms/classify-lib/interfaces"


// enroll students to courses
export const sampleEnrollStudents: Omit<StudentCourse, StudentCourseKeys.WITHDRAWAL_DATE>[] = sampleStudents
    .map((student, index) => {

        const course = sampleCourses[index % sampleCourses.length]

        return {
            studentId: student.id!,
            courseId: course.id,
            enrolled_at: new Date().toISOString(),
            status: StundetEnrollmentStatus.ACTIVE,
            version: 1
        }
    })