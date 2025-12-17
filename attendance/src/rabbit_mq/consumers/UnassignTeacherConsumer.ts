import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { TeacherCourse as TeacherCourseAttrs, TeacherUnassignedEvent } from "@rkh-ms/classify-lib/interfaces";
import { TeacherCourse } from "../../models/TeacherCourse";


export class UnassignTeacherConsumer extends Consumer<TeacherUnassignedEvent> {

    exchange: ExchangesName.TeacherUnassigned = ExchangesName.TeacherUnassigned
    queueName: string = AttendanceServiceQueue.TeacherUnassigned

    async onMessage(data: TeacherCourseAttrs) {

        // first check if student already enrolled
        const isAssigned = await TeacherCourse.findOne({
            where: {
                courseId: data.courseId,
                teacherId: data.teacherId,
                version: data.version - 1
            }
        })

        if (!isAssigned)
            throw new Error('Event out of order')

        // update the student course record
        await isAssigned.update(data)
    }
}