import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { MaterialsServiceQueue } from "@rkh-ms/classify-lib/enums";
import { Course as CourseAttrs, CourseCreatedEvent, Lesson, TeacherCourse } from "@rkh-ms/classify-lib/interfaces";
import { sequelize } from "../../connect";
import { TeacherCourse as TeacherCourseModel } from "../../models/TeacherCourse";
import { Course } from "../../models/Course";

/**This consumer handle event when new course created
 * 
 * this done by first creating the course
 * 
 * and as well the teachers assigned to the course
 */
export class CourseCreatedConsumer extends Consumer<CourseCreatedEvent> {
    exchange: ExchangesName.CourseCreated = ExchangesName.CourseCreated
    queueName: string = MaterialsServiceQueue.CourseCreated

    async onMessage(data: CourseAttrs & {
        lessons: Lesson[];
        teachers: TeacherCourse[];
    }) {

        const transaction = await sequelize.transaction()
        try {

            // first create the course 
            await Course.create(data, { transaction })

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