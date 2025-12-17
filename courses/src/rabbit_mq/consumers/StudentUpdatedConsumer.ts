import { Consumer, ExchangesName, StudentSpecificAttr, StudentUpdatedEvent } from "@rkh-ms/classify-lib";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Student } from "../../models/Student";


export class StundetUpdatedConsumer extends Consumer<StudentUpdatedEvent> {
    exchange: ExchangesName.StudentUpdated = ExchangesName.StudentUpdated
    queueName: string = CourseServiceQueue.StudentUpdated

    async onMessage(data: StudentSpecificAttr) {

        // first check if the student exists
        const student = await Student.findOne({
            where: {
                id: data.id,
                version: data.version - 1
            }
        })

        if (!student)
            throw new Error('Student not found, or event out of order')

        // update student values
        student.set(data)
        await student.save()
    }
}