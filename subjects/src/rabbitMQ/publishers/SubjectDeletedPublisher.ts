import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { SubjectDeletedEvent } from "@rkh-ms/classify-lib/interfaces";

/**Class to emit subject deleted event to the Exchange */
export class SubjectDeletedPublisher extends Publisher<SubjectDeletedEvent> {
    exchange: ExchangesName.SubjectDeleted = ExchangesName.SubjectDeleted
}