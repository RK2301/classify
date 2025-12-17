import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { SubjectUpdatedEvent } from "@rkh-ms/classify-lib/interfaces";

export class SubjectUpdatedPublisher extends Publisher<SubjectUpdatedEvent> {
    exchange: ExchangesName.SubjectUpdated = ExchangesName.SubjectUpdated
}