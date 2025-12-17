import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { StudentEnrolledEvent } from "@rkh-ms/classify-lib/interfaces";

export class StudentEnrolledPublisher extends Publisher<StudentEnrolledEvent> {
    exchange: ExchangesName.StudentEnrolled = ExchangesName.StudentEnrolled
}