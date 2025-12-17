import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { StudentCourse as StudentCourseAttrs, StudentWithdrawalEvent } from "@rkh-ms/classify-lib/interfaces";
import { StudentCourse } from "../../models/StudentCourse";


export class StudentWithdrawalConsumer extends Consumer<StudentWithdrawalEvent> {
    exchange: ExchangesName.StudentWithdrawal = ExchangesName.StudentWithdrawal
    queueName: string = AttendanceServiceQueue.StudentWithdrawal

    async onMessage(data: StudentCourseAttrs) {

        // first check if student already enrolled
        const isEnrolled = await StudentCourse.findOne({
            where: {
                courseId: data.courseId,
                studentId: data.studentId,
                version: data.version - 1
            }
        })

        if (!isEnrolled)
            throw new Error('Event out of order')

        // update the student course record
        await isEnrolled.update(data)
    }
}