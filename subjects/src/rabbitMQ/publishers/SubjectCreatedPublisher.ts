import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { SubjectCreatedEvent } from "@rkh-ms/classify-lib/interfaces";

/**class to publish subject created event to Exchange */
export class SubjectCreatedPublisher extends Publisher<SubjectCreatedEvent> {
    exchange: ExchangesName.SubjectCreated = ExchangesName.SubjectCreated
}