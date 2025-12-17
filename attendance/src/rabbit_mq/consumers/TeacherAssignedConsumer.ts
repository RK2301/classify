import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { TeacherAssignedEvent, TeacherCourse as TeacherCourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { TeacherCourse } from "../../models/TeacherCourse";


export class TeacherAssignedConsumer extends Consumer<TeacherAssignedEvent> {
    exchange: ExchangesName.TeacherAssigned = ExchangesName.TeacherAssigned
    queueName: string = AttendanceServiceQueue.TeacherAssigned

    async onMessage(data: TeacherCourseAttrs) {

        // first check if the teacher assigned earlier
        const assigned = await TeacherCourse.findOne({
            where: {
                courseId: data.courseId,
                teacherId: data.teacherId
            }
        })

        // if teacher not assigned, then add to the table
        if (!assigned)
            await TeacherCourse.create(data)
        else if (assigned.dataValues.version !== data.version - 1)
            throw new Error('event out of order')
        else
            await assigned.update(data)
    }
}