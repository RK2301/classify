import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";
import { SubjectDeletedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Subject } from "../../models/Subject";


export class SubjectDeletedConsumer extends Consumer<SubjectDeletedEvent> {
    exchange: ExchangesName.SubjectDeleted = ExchangesName.SubjectDeleted
    queueName: string = CourseServiceQueue.SubjectDeleted

    async onMessage(data: { id: number; }) {

        await Subject.destroy({
            where: {
                id: data.id
            }
        })
    }
}