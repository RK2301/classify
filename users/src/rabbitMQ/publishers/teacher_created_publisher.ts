import { ExchangesName, Publisher, TeacherCreatedEvent } from "@rkh-ms/classify-lib";

export class TeacherCreatedPublisher extends Publisher<TeacherCreatedEvent> {
    exchange: ExchangesName.TeacherCreated = ExchangesName.TeacherCreated
}