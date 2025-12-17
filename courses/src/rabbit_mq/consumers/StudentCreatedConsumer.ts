import { Consumer, ExchangesName, StudentAttributes, StudentCreatedEvent } from "@rkh-ms/classify-lib";
import { CourseServiceQueue } from "@rkh-ms/classify-lib/enums";
import { sequelize } from "../../connect";
import { User } from "../../models/User";
import { Student } from "../../models/Student";


export class StudnetCreatedConsumer extends Consumer<StudentCreatedEvent> {
    exchange: ExchangesName.StudentCreated = ExchangesName.StudentCreated
    queueName: string = CourseServiceQueue.StudentCreated

    async onMessage(data: StudentAttributes) {

        // start a transaction
        const transaction = await sequelize.transaction()

        try {
            // create a user
            await User.create(data, { transaction })

            // create a student
            await Student.create(data, { transaction })

            await transaction.commit()

        } catch (err) {
            console.error('Error while try adding new student', err);
            await transaction.rollback()
            throw err
        }

    }
}