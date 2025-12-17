import { ExchangesName, Publisher, StudentUpdatedEvent } from "@rkh-ms/classify-lib";

export class StudentUpdatedPublisher extends Publisher<StudentUpdatedEvent> {
    exchange: ExchangesName.StudentUpdated = ExchangesName.StudentUpdated
}