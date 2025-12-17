import { ExchangesName, Publisher } from "@rkh-ms/classify-lib"
import { CourseUpdatedEvent } from "@rkh-ms/classify-lib/interfaces";


export class CourseUpdatedPublisher extends Publisher<CourseUpdatedEvent> {
    exchange: ExchangesName.CourseUpdated = ExchangesName.CourseUpdated
}