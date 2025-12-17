import { Consumer, ExchangesName, UsersServiceQueues } from "@rkh-ms/classify-lib";
import { SubjectDeletedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Subject } from "../../models/subject";


export class SubjectDeletedConsumer extends Consumer<SubjectDeletedEvent> {
    exchange: ExchangesName.SubjectDeleted = ExchangesName.SubjectDeleted
    queueName: string = UsersServiceQueues.SubjectDeletedQueue

    async onMessage(data: { id: number; }) {

        // first check if the subject exists
        await Subject.destroy({
            where: {
                id: data.id
            }
        })
    }
}