import { ExchangesName, ManagerUpdatedEvent, Publisher } from "@rkh-ms/classify-lib";

export class ManagerUpdatedPublisher extends Publisher<ManagerUpdatedEvent> {
    exchange: ExchangesName.ManagerUpdated = ExchangesName.ManagerUpdated
}