import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Lesson as LessonAttrs, LessonsStatusChangedEvent } from "@rkh-ms/classify-lib/interfaces";
import { sequelize } from "../../connect";
import { Lesson } from "../../models/Lesson";


export class LessonsStatusChanged extends Consumer<LessonsStatusChangedEvent> {

    exchange: ExchangesName.LessonsStatusChanged = ExchangesName.LessonsStatusChanged
    queueName: string = AttendanceServiceQueue.LessonsStatusChanged

    async onMessage(data: LessonAttrs[]) {
        // loop over the lessons
        // for each one check if the lesson exists
        // if yes then update the lesson data
        // if no, then throw error and rollback the transaction
        // future improvment could be in the publisher (publish each lesson alone instead of all of the lessons changed, since they not relatable)
        const transaction = await sequelize.transaction()
        try {

            for (const lesson of data) {
                const lessonToUpdate = await Lesson.findOne({
                    where: {
                        id: lesson.id,
                        version: lesson.version - 1
                    }
                })

                // if lesson not found then throw error
                if (!lessonToUpdate)
                    throw new Error(`Lesson ${lesson.id} not found, or event out of order`)

                // update lesson data
                await lessonToUpdate.update(lesson, { transaction })

            }

            // after making all changes, commit the transaction
            await transaction.commit()

        } catch (err) {
            console.error(err);
            transaction.rollback()
            throw err
        }

    }
}