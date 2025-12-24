import { rabbitMQ_Wrapper, UserRole } from "@rkh-ms/classify-lib"
import { User } from "../models/user"
import { Teacher } from "../models/teacher"
import { Manager } from "../models/manager"
import { TeacherCreatedPublisher } from "../rabbitMQ/publishers/teacher_created_publisher"
import { ManagerCreatedPublisher } from "../rabbitMQ/publishers/manager_created_publisher"
import { sequelize } from "../connect"

/**This function is to add a new default manager (if not exists),
 * when the app start.
 * 
 * code will be excuted after 15sec after the service startup, to ensure connection with MYSQL and RabbitMQ
 */
export const defaultManager = (id: string, firstName: string, lastName: string,
    email: string) => {
    setTimeout(async () => {

        const t = await sequelize.transaction()

        try {
            //first create user
            const user = await User.create({
                id,
                firstName,
                lastName,
                email,
                role: UserRole.Manager,
                password: 'Classify2026'
            }, { transaction: t })

            //create Teacher
            const teacher = await Teacher.create({
                id,
                startDate: new Date().toISOString()
            }, { transaction: t })

            //create manager
            const manager = await Manager.create({
                id,
                startDate: new Date().toISOString()
            }, { transaction: t })

            //publish events to RabbitMQ 
            await new TeacherCreatedPublisher(rabbitMQ_Wrapper.channel).publish({
                ...user.get(),
                startDate: teacher.startDate
            })

            await new ManagerCreatedPublisher(rabbitMQ_Wrapper.channel).publish({
                ...manager.get()
            })

            await t.commit()
        } catch (err) {
            console.error(err);
            await t.rollback()
        }

    }, 15 * 1000)
}