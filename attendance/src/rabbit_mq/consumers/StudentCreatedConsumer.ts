import { Consumer, ExchangesName, StudentAttributes, StudentCreatedEvent } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { User } from "../../models/User";

export class StudentCreatedConsumer extends Consumer<StudentCreatedEvent> {
    exchange: ExchangesName.StudentCreated = ExchangesName.StudentCreated
    queueName: string = AttendanceServiceQueue.StudentCreated

    async onMessage(data: StudentAttributes) {

        // create and add the new student to the users table
        await User.create(data)
    }
}