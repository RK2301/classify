import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { LessonDeletedEvent } from "@rkh-ms/classify-lib/interfaces";

/**Class publish event indicating lesson deleted */
export class LessonDeletedPublisher extends Publisher<LessonDeletedEvent> {
    exchange: ExchangesName.LessonDeleted = ExchangesName.LessonDeleted
}