import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { CourseDeletedEvent } from "@rkh-ms/classify-lib/interfaces";
import { sequelize } from "../../connect";
import { Lesson } from "../../models/Lesson";
import { StudentCourse } from "../../models/StudentCourse";
import { TeacherCourse } from "../../models/TeacherCourse";


export class CourseDeletedConsumer extends Consumer<CourseDeletedEvent> {
    exchange: ExchangesName.CourseDeleted = ExchangesName.CourseDeleted
    queueName: string = AttendanceServiceQueue.CourseDeleted

    async onMessage(data: { id: number; }) {

        const transaction = await sequelize.transaction()
        try {
            // delete all lessons related to the deleted course
            //  when the lessons removed, all attendance realted to the lesson will be deleted
            await Lesson.destroy({
                where: {
                    course_id: data.id
                },
                transaction
            })

            // remove all students were enrolled for the course
            await StudentCourse.destroy({
                where: {
                    courseId: data.id
                },
                transaction
            })

            // remove all teacher assigned to the course
            await TeacherCourse.destroy({
                where: {
                    courseId: data.id
                },
                transaction
            })

            await transaction.commit()

        } catch (err) {
            console.error(err);
            transaction.rollback()
            throw err
        }

    }
}