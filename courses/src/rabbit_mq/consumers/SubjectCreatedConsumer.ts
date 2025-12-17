import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { Subject, SubjectCreatedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Subject as SubejctModel } from "../../models/Subject";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";

export class SubjectCreatedConsumer extends Consumer<SubjectCreatedEvent> {
    exchange: ExchangesName.SubjectCreated = ExchangesName.SubjectCreated
    queueName: string = CourseServiceQueue.SubjectCreated

    async onMessage(data: Subject) {

        try {
            await SubejctModel.create(data)
        } catch (err) {
            console.error('Error creating subject', err);
            throw err
        }
    }
}