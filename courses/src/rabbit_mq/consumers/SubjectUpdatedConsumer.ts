import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Subject, SubjectUpdatedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Subject as SubjectModel } from "../../models/Subject";

export class SubjectUpdatedConsumer extends Consumer<SubjectUpdatedEvent> {
    exchange: ExchangesName.SubjectUpdated = ExchangesName.SubjectUpdated
    queueName: string = CourseServiceQueue.SubjectUpdated

    async onMessage(data: Subject) {
        const subject = await SubjectModel.findByPk(data.id)

        if (!subject)
            throw new Error(`Subject ${data.he} not found`)

        subject.set(data)
        await subject.save()

    }
}