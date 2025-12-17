import { Consumer, ExchangesName, TeacherCreatedEvent } from "@rkh-ms/classify-lib";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";
import { User } from "../../models/User";
import { Teacher } from "../../models/Teacher";
import { sequelize } from "../../connect";

/**This consumer listen for teacher created event, and handle it by adding new teacher */
export class TeacherCreatedConsumer extends Consumer<TeacherCreatedEvent> {
    exchange: ExchangesName.TeacherCreated = ExchangesName.TeacherCreated
    queueName: string = CourseServiceQueue.TeacherCreated

    async onMessage(data: TeacherCreatedEvent['data']) {

        const transaction = await sequelize.transaction()

        try {
            // add new user
            await User.create(data, { transaction })

            // add new teacher
            await Teacher.create(data, { transaction })

            await transaction.commit()

        } catch (err) {
            console.error('Error while try adding new teacher', err);
            transaction.rollback()
            throw err
        }

    }
}