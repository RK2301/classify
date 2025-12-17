import { ExchangesName, Publisher, UserUpdatedEvent } from "@rkh-ms/classify-lib";

export class UserUpdatedPublisher extends Publisher<UserUpdatedEvent> {
    exchange: ExchangesName.UserUpdated = ExchangesName.UserUpdated
}