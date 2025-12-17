import { Consumer, ExchangesName } from "@rkh-ms/classify-lib";
import { MaterialsServiceQueue } from "@rkh-ms/classify-lib/enums";
import { StudentCourse as StudentCourseAttrs, StudentEnrolledEvent } from "@rkh-ms/classify-lib/interfaces";
import { StudentCourse } from "../../models/StudentCourse";


export class StudentEnrolledConsumer extends Consumer<StudentEnrolledEvent> {
    exchange: ExchangesName.StudentEnrolled = ExchangesName.StudentEnrolled
    queueName: string = MaterialsServiceQueue.StudentEnrolled

    async onMessage(data: StudentCourseAttrs) {


        // first check if the student enrolled earlier
        const enrolled = await StudentCourse.findOne({
            where: {
                courseId: data.courseId,
                studentId: data.studentId
            }
        })


        // if student not enrolled, then add to the table
        if (!enrolled)
            await StudentCourse.create(data)
        else if (enrolled.dataValues.version !== data.version - 1)
            throw new Error('event out of order')
        else
            await enrolled.update(data)

    }
}