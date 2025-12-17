import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { CourseCreatedEvent } from "@rkh-ms/classify-lib/interfaces";


export class CourseCreatedPublisher extends Publisher<CourseCreatedEvent> {
    exchange: ExchangesName.CourseCreated = ExchangesName.CourseCreated
}