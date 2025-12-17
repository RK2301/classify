import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { LessonCreatedEvent } from "@rkh-ms/classify-lib/interfaces";


export class LessonCreatedPublisher extends Publisher<LessonCreatedEvent> {
    exchange: ExchangesName.LessonCreated = ExchangesName.LessonCreated
}