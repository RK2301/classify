import { Consumer, ExchangesName, UserAttributes, UserUpdatedEvent } from "@rkh-ms/classify-lib";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";
import { User } from "../../models/User";

/**This consumer listen for a user updated event and update user current values */
export class UserUpdatedConsumer extends Consumer<UserUpdatedEvent> {
    exchange: ExchangesName.UserUpdated = ExchangesName.UserUpdated
    queueName: string = CourseServiceQueue.UserUpdated

    async onMessage(data: UserAttributes) {

        // check if user exists
        const user = await User.findOne({
            where: {
                id: data.id,
                version: data.version - 1
            }
        })

        if (!user)
            throw new Error('User not found, or event out of order')

        // update the user data
        user.set(data)
        await user.save()
    }
}