import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Lesson as LessonAttrs, LessonUpdatedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Lesson } from "../../models/Lesson";


export class LessonUpdatedConsumer extends Consumer<LessonUpdatedEvent> {
    exchange: ExchangesName.LessonUpdated = ExchangesName.LessonUpdated
    queueName: string = AttendanceServiceQueue.LessonUpdated

    async onMessage(data: LessonAttrs) {

        // check if lesson exists
        const lesson = await Lesson.findOne({
            where: {
                id: data.id,
                version: data.version - 1
            }
        })

        if (!lesson)
            throw new Error('Lesson not found, or event out of order')

        await lesson.update(data)
    }
}