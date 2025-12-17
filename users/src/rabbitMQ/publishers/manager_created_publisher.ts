import { ExchangesName, ManagerCreatedEvent, Publisher } from "@rkh-ms/classify-lib";

export class ManagerCreatedPublisher extends Publisher<ManagerCreatedEvent> {
    exchange: ExchangesName.ManagerCreated = ExchangesName.ManagerCreated
}