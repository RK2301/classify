import { ExchangesName, RequestResetPasswordEvent, RPCPublisher } from "@rkh-ms/classify-lib";
import { ReceivedError } from "@rkh-ms/classify-lib/errors";
import { ConsumeMessage } from "amqplib";
import { randomUUID } from 'crypto'

export class RequestResetPasswordPublisher extends RPCPublisher<RequestResetPasswordEvent> {

    exchange: ExchangesName.RequestResetPassword = ExchangesName.RequestResetPassword
    protected correlationId = randomUUID();

    onMesssage(data: RequestResetPasswordEvent['response'], msg: ConsumeMessage): Promise<void> {
        return new Promise((resolve, reject) => {

            this.channel.ack(msg)
            if (data.errors)
                reject(
                    new ReceivedError(data.statusCode, data.errors)
                )
            else
                resolve()
        })

    }
}