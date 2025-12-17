import { Consumer, ExchangesName, ResetPasswordServiceQueues, UserUpdatedEvent } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";

export class UserUpdatedConsumer extends Consumer<UserUpdatedEvent> {
    exchange: ExchangesName.UserUpdated = ExchangesName.UserUpdated
    queueName: string = ResetPasswordServiceQueues.UserUpdatedQueue

    async onMessage(data: UserUpdatedEvent['data']) {
        console.log(data);

        //check if the user already exists in the DB
        const user = await User.findOne({
            where: {
                id: data.id,
                version: data.version - 1
            }
        })
        if (user) {
            //update the user
            user.set({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                version: data.version
            })
            await user.save()

        }
    }
}