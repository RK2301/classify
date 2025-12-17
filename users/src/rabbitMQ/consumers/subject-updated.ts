import { Consumer, ExchangesName, UsersServiceQueues } from "@rkh-ms/classify-lib";
import { Subject, SubjectUpdatedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Subject as SubjectModel } from "../../models/subject";

/**A class to wait for subject update event and update the corresponding subject accordinly */
export class SubjectUpdatedConsumer extends Consumer<SubjectUpdatedEvent> {
    exchange: ExchangesName.SubjectUpdated = ExchangesName.SubjectUpdated
    queueName: string = UsersServiceQueues.SubjectUpdatedQueue


    async onMessage(data: Subject){

        // get the suubject object from the DB
        const subject = await SubjectModel.findByPk(data.id)
        if (!subject)
            throw Error('Subject not found!')

        // update the values
        subject.set(data)
        await subject.save()
    }
}