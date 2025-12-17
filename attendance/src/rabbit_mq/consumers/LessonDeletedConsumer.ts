import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { LessonDeletedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Lesson } from "../../models/Lesson";


export class LessonDeletedConsumer extends Consumer<LessonDeletedEvent> {
    exchange: ExchangesName.LessonDeleted = ExchangesName.LessonDeleted
    queueName: string = AttendanceServiceQueue.LessonDeleted

    async onMessage(data: { id: number; }) {

        await Lesson.destroy({
            where: {
                id: data.id
            }
        });

    }
}