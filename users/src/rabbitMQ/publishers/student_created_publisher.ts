import { ExchangesName, Publisher, StudentCreatedEvent } from "@rkh-ms/classify-lib";

export class StudentCreatedPublisher extends Publisher<StudentCreatedEvent> {
    exchange: ExchangesName.StudentCreated = ExchangesName.StudentCreated
}