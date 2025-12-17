import { Consumer, ExchangesName, ShiftServiceQueues, UserAttributes, UserRole, UserUpdatedEvent } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";

/**when a user update event emitted then then need to update user current data in our DB
 * 
 * espically the user role & version
 */
export class UserUpdatedConsumer extends Consumer<UserUpdatedEvent> {
    exchange: UserUpdatedEvent['exchange'] = ExchangesName.UserUpdated;
    queueName: ShiftServiceQueues.UserUpdatedQueue = ShiftServiceQueues.UserUpdatedQueue

    /**when a user update event emitted then when need to update user current data in our DB */
    async onMessage(data: UserUpdatedEvent['data']) {

        // not intrested in students updates
        if (data.role === UserRole.Student) return 

        //fetch the user from the DB
        const user = await User.findByPk(data.id)
        if (!user) {
            console.error(`User with id ${data.id} not found`);
            throw new Error(`User with id ${data.id} not found`);
        }

        //update the user data
        user.set(data as UserAttributes);
        await user.save();

    }
}