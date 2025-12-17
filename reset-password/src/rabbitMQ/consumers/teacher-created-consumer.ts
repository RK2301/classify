import { Consumer, ExchangesName, ResetPasswordServiceQueues, TeacherCreatedEvent } from "@rkh-ms/classify-lib";
import { User } from "../../models/user";

export class TeacherCreatedConsumer extends Consumer<TeacherCreatedEvent> {
    exchange: ExchangesName.TeacherCreated = ExchangesName.TeacherCreated
    queueName: string = ResetPasswordServiceQueues.TeacherCreatedQueue

    async onMessage(data: TeacherCreatedEvent['data']){
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