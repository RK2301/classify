import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { AttendanceServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Course, CourseCreatedEvent, Lesson, TeacherCourse } from "@rkh-ms/classify-lib/interfaces";
import { sequelize } from "../../connect";
import { Lesson as LessonModel } from "../../models/Lesson";
import { TeacherCourse as TeacherCourseModel } from "../../models/TeacherCourse";

/**This consumer handle event when new course created
 * 
 * this done by creating all lesson realated to the lesson
 * 
 * and as well the teachers assigned to the course
 */
export class CourseCreatedConsumer extends Consumer<CourseCreatedEvent> {
    exchange: ExchangesName.CourseCreated = ExchangesName.CourseCreated
    queueName: string = AttendanceServiceQueue.CourseCreated

    async onMessage(data: Course & {
        lessons: Lesson[];
        teachers: TeacherCourse[];
    }) {

        const transaction = await sequelize.transaction()
        try {

            // first create all lessons 
            await LessonModel.bulkCreate(data.lessons, { transaction })

            // second assign the teachers
            await TeacherCourseModel.bulkCreate(data.teachers, { transaction })

            await transaction.commit()

        } catch (err) {
            console.error(err);
            transaction.rollback()
            throw err
        }

    }
}