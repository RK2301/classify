import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { CourseDeletedEvent } from "@rkh-ms/classify-lib/interfaces";


export class CourseDeletedPublisher extends Publisher<CourseDeletedEvent> {
    exchange: ExchangesName.CourseDeleted = ExchangesName.CourseDeleted
}