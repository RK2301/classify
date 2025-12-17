import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Lesson as LessonAttrs, LessonCreatedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Lesson } from "../../models/Lesson";


export class LessonCreatedConsumer extends Consumer<LessonCreatedEvent> {
    exchange: ExchangesName.LessonCreated = ExchangesName.LessonCreated
    queueName: string = AttendanceServiceQueue.LessonCreated

    async onMessage(data: LessonAttrs) {
        await Lesson.create(data)
    }
}