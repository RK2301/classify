import { Consumer, ExchangesName, UserAttributes, UserRole, UserUpdatedEvent } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { User } from "../../models/User";


export class UserUpdatedConsumer extends Consumer<UserUpdatedEvent> {
    exchange: ExchangesName.UserUpdated = ExchangesName.UserUpdated
    queueName: string = AttendanceServiceQueue.UserUpdated

    async onMessage(data: UserAttributes) {

        // no need to update non-students users
        if (data.role !== UserRole.Student)
            return


        // first check if the student exists
        const student = await User.findByPk(data.id)
        if (!student)
            throw new Error('User not found')

        // check if curent version is the new version - 1
        if (student.dataValues.version !== data.version - 1)
            throw new Error('Event out of order')

        // update the student successfully
        await student.update(data)
    }
}