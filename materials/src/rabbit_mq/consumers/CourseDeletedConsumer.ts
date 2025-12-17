import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { MaterialsServiceQueue } from "@rkh-ms/classify-lib/enums";
import { CourseDeletedEvent } from "@rkh-ms/classify-lib/interfaces";
import { Course } from "../../models/Course";
import { sequelize } from "../../connect";
import { bucket } from "../../config/firebase";
import { pathToCourse } from "../../utils/pathToCourse";



export class CourseDeletedConsumer extends Consumer<CourseDeletedEvent> {
    exchange: ExchangesName.CourseDeleted = ExchangesName.CourseDeleted
    queueName: string = MaterialsServiceQueue.CourseDeleted

    async onMessage(data: { id: number; }) {

        //  deleted the course course
        //  when the course delete all teacher and student related to the course will be deleted
        //  as well the materials and files

        const transaction = await sequelize.transaction()

        try {
            await Course.destroy({
                where: {
                    id: data.id
                },
                transaction
            })

            // make request to delete a files from the firebase storage
            const [files] = await bucket.getFiles({ prefix: pathToCourse(data.id) })
            if (files.length > 0)
                await Promise.all(files.map(file => file.delete()))

            await transaction.commit()

        } catch (err) {
            console.error(err);
            transaction.rollback()
            throw err
        }
    }
}