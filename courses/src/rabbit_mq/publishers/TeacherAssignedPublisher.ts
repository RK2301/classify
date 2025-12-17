import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { TeacherAssignedEvent } from "@rkh-ms/classify-lib/interfaces";


export class TeacherAssignedPublisher extends Publisher<TeacherAssignedEvent> {
    exchange: ExchangesName.TeacherAssigned = ExchangesName.TeacherAssigned
}