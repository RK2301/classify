import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { LessonsStatusChangedEvent } from "@rkh-ms/classify-lib/interfaces";

/**Publisher that publish event related to some set of lessons have status of completed instead of ongoing */
export class LessonsStatusChangedPublisher extends Publisher<LessonsStatusChangedEvent> {
    exchange: ExchangesName.LessonsStatusChanged = ExchangesName.LessonsStatusChanged
}