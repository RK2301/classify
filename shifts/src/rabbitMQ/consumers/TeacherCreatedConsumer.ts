import { Consumer, ExchangesName, ShiftServiceQueues, TeacherCreatedEvent } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";


/**When a teacher created event emitted when need to create a new teacher into our DB.
 * 
 * 
 * so later the teacher can be logged in/out from the shifts
 */
export class TeacherCreatedConsumer extends Consumer<TeacherCreatedEvent> {
    exchange: ExchangesName.TeacherCreated = ExchangesName.TeacherCreated
    queueName: ShiftServiceQueues.TeacherCreatedQueue = ShiftServiceQueues.TeacherCreatedQueue

    async onMessage(data: TeacherCreatedEvent['data']) {

        const user = await User.create({ ...data })
        await user.save()
    }
}