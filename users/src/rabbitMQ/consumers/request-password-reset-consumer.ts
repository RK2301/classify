import { ExchangesName, rabbitMQ_Wrapper, RequestResetPasswordEvent, RPCConsumer, UsersServiceQueues } from "@rkh-ms/classify-lib";
import { ConsumeMessage } from "amqplib";
import { User } from "../../models/user";
import { CustomError, DatabaseConnectionError, NotFoundError, ServerError } from "@rkh-ms/classify-lib/errors";
import { UserUpdatedPublisher } from "../publishers/user_updated_publisher";
import { BaseError } from "sequelize";


export class RequestPasswordResetConsumer extends RPCConsumer<RequestResetPasswordEvent> {
    protected exchange: RequestResetPasswordEvent['exchange'] = ExchangesName.RequestResetPassword
    protected queueName: string = UsersServiceQueues.RequestPasswordResetQueue

    async onMessage(data: RequestResetPasswordEvent['data'], msg: ConsumeMessage): Promise<void> {

        try {

            //so we need to access DB and check if users exists to update the password
            const user = await User.findOne({
                where: {
                    id: data.id
                }
            })

            //if users not exists, so emit an error
            if (!user)
                throw new NotFoundError()

            //update the password
            user.password = data.password
            await user.save()

            //now emit an event indicate users data updated
            const vals = { ...user.dataValues }
            delete vals.password

            await new UserUpdatedPublisher(rabbitMQ_Wrapper.channel).publish(vals)

            //response to the request with success
            await this.publish(
                { statusCode: 200 },
                msg.properties.replyTo,
                msg.properties.correlationId
            )
            this.channel.ack(msg)

        } catch (err) {
            console.error(err);

            //save error data
            //defalut is server error
            let custom_err: CustomError = new ServerError()

            if (err instanceof CustomError)
                custom_err = err

            //if error throwen by sequlize (DB)
            if (err instanceof BaseError)
                custom_err = new DatabaseConnectionError()

            //handle errors throwen from the above code
            await this.publish({
                statusCode: custom_err.statusCode,
                errors: custom_err.serializeErrors().map(val => ({ message: val.message }))
            },
                msg.properties.replyTo,
                msg.properties.correlationId
            )
            this.channel.ack(msg)
        }
    }
}