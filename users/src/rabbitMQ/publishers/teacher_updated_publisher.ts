import { ExchangesName, Publisher, TeacherUpdatedEvent } from "@rkh-ms/classify-lib";

export class TeacherUpdatedPublisher extends Publisher<TeacherUpdatedEvent> {
    exchange: ExchangesName.TeacherUpdated = ExchangesName.TeacherUpdated
}