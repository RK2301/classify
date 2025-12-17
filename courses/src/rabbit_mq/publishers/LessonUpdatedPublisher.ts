import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { LessonUpdatedEvent } from "@rkh-ms/classify-lib/interfaces";

/**class to publish event related to updated lesson */
export class LessonUpdatedPublisher extends Publisher<LessonUpdatedEvent> {
    exchange: ExchangesName.LessonUpdated = ExchangesName.LessonUpdated
}