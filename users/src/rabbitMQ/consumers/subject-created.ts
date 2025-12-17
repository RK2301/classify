import { Consumer, ExchangesName, UsersServiceQueues } from "@rkh-ms/classify-lib";
import { Subject, SubjectCreatedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Subject as SubjectModel } from "../../models/subject";


export class SubjectCreatedConsumer extends Consumer<SubjectCreatedEvent> {
    exchange: ExchangesName.SubjectCreated = ExchangesName.SubjectCreated
    queueName: string = UsersServiceQueues.SubjectCreatedQueue

    async onMessage(data: Subject){

        // take the data and add new subject
        await SubjectModel.create(data)
    }
}