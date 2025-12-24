import cron from 'node-cron'
import { Op } from 'sequelize';

import { LessonStatus } from '@rkh-ms/classify-lib/enums';
import { rabbitMQ_Wrapper } from '@rkh-ms/classify-lib';

import { Lesson } from '../models/Lesson';
import { sequelize } from '../connect';
import { LessonsStatusChangedPublisher } from '../rabbit_mq/publishers/LessonsStatusChangedPublisher';

/**every 45 mintues check which lessons should have status of ongoing or completed
 * and update them accordingly
 * 
 * lessons with status set to cancelled should not be updated
 */
cron.schedule('*/45 * * * *', async () => {

    console.log('Running lesson status update task...');

    // 1. first get all lessons that are not cancelled and should be ongoing
    const ongoingLessonsPromise = Lesson.findAll({
        where: {
            startTime: {
                [Op.lte]: new Date()
            },
            endTime: {
                [Op.gte]: new Date()
            },
            status: LessonStatus.SCHEDULED
        }
    })

    const completedLessonsPromise = Lesson.findAll({
        where: {
            status: {
                [Op.or]: [LessonStatus.ONGOING, LessonStatus.SCHEDULED]
            },
            endTime: {
                [Op.lt]: new Date()
            }
        }
    })

    // wait for both promises to resolve
    const [ongoingLessons, completedLessons] = await Promise.all([ongoingLessonsPromise,
        completedLessonsPromise]);


    // if there a lesson must update their status to ongoing then run update query
    if (ongoingLessons.length > 0) {
        console.log(`Found ${ongoingLessons.length} lessons to update to ongoing status.`);

        // use transaction to ensure that lessons updated then fetched successfully to emit event
        const onGoingTransaction = await sequelize.transaction()

        try {
            await Lesson.update({
                status: LessonStatus.ONGOING,
                version: sequelize.literal('version + 1')
            }, {
                where: {
                    id: ongoingLessons.map(lesson => lesson.dataValues.id)
                },
                transaction: onGoingTransaction
            })

            // get updated lessons to emit event
            new LessonsStatusChangedPublisher(rabbitMQ_Wrapper.channel).publish(
                (await Lesson.findAll({
                    where: {
                        id: ongoingLessons.map(lesson => lesson.dataValues.id)
                    },
                    transaction: onGoingTransaction
                }))
                    .map(lesson => lesson.dataValues)
            )

            await onGoingTransaction.commit()

        } catch (err) {
            console.error(`Error updating lessons to ongoing status: ${err}`);
            onGoingTransaction.rollback()
        }
    }


    //  2. now check if a lessons are completed and their status still not completed
    // if there a lesson must update their status to completed then run update query
    if (completedLessons.length > 0) {

        console.log(`Found ${completedLessons.length} lessons to update to completed status.`);

        const completedTransaction = await sequelize.transaction()
        try {
            await Lesson.update({
                status: LessonStatus.COMPLETED,
                version: sequelize.literal('version + 1')
            }, {
                where: {
                    id: completedLessons.map(lesson => lesson.dataValues.id)
                },
                transaction: completedTransaction
            })

            // get updated lessons to emit event
            new LessonsStatusChangedPublisher(rabbitMQ_Wrapper.channel)
                .publish(
                    (await Lesson.findAll({
                        where: {
                            id: completedLessons.map(lesson => lesson.dataValues.id)
                        },
                        transaction: completedTransaction
                    })).map(lesson => lesson.dataValues)
                )


            await completedTransaction.commit()

        } catch (err) {
            console.error(`Error updating lessons to completed status: ${err}`);
            completedTransaction.rollback()
        }
    }
})