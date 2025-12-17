import { Consumer, ExchangesName, ResetPasswordServiceQueues, StudentCreatedEvent, StudentServiceQueues } from "@rkh-ms/classify-lib";
import { StudentAttributes } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";

export class StudentCreatedConsumer extends Consumer<StudentCreatedEvent> {
    exchange: ExchangesName.StudentCreated = ExchangesName.StudentCreated
    queueName: string = ResetPasswordServiceQueues.StudentCreatedQueue

    async onMessage(data: StudentAttributes): Promise<void> {
        console.log(data);

        const user = User.build({
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone
        })
        await user.save()
    }

}