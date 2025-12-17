import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { TeacherUnassignedEvent } from "@rkh-ms/classify-lib/interfaces";


export class TeacherUnassignedPublisher extends Publisher<TeacherUnassignedEvent> {
    exchange: ExchangesName.TeacherUnassigned = ExchangesName.TeacherUnassigned
}