import { Consumer, ExchangesName, TeacherEventsAttr, TeacherUpdatedEvent } from "@rkh-ms/classify-lib";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Teacher } from "../../models/Teacher";


export class TeacherUpdatedConsumer extends Consumer<TeacherUpdatedEvent> {

    exchange: ExchangesName.TeacherUpdated = ExchangesName.TeacherUpdated
    queueName: string = CourseServiceQueue.TeacherUpdated

    async onMessage(data: TeacherEventsAttr) {

        // check if the teacher exists
        const teacher = await Teacher.findOne({
            where: {
                id: data.id,
                version: data.version - 1
            }
        })

        //if not exists then throw a error
        if (!teacher)
            throw new Error('Teacher not found, or event out of order')

        teacher.set(data)
        await teacher.save()
    }
}