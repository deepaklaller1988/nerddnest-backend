import { Queue } from "bullmq";
import RedisConn from '../redis-connection';
import logger from "../../logger";

export const postQueue = new Queue("postsQueue", {
    connection: RedisConn
  });

export const schedulePost = async (postId: number, userId: number, scheduledAt: Date) => {
    try {

         // Convert scheduledAt to a Date object if it's not already
    const scheduledTime = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;

    if (isNaN(scheduledTime.getTime())) {
        logger.error(`Invalid scheduled time provided: ${scheduledAt}`);
        return {success: false, message: `Invalid scheduled time provided: ${scheduledAt}`};
      }

      const delay = scheduledTime.getTime() - new Date().getTime(); // Time difference in milliseconds
  
      if (delay <= 0) {
        logger.error(`QUEUE | POST ID: ${postId} | USER ID: ${userId} - Scheduled time must be in the future.`)
        return {success: false, message: `Scheduled time must be in the future.`};
      }
  
      logger.info(`QUEUE | POST ID: ${postId} | USER ID: ${userId} - Scheduling`)
  
      // Add the job to the queue with a delay
      const job = await postQueue.add(
        "publishPost", // Job name
        { postId, userId }, // Data to pass to the worker
        { delay,
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: true,
         } // Delay in milliseconds
      );
      console.log(`Job added to queue: ${job.id}`);
      return {success: true, message: `Job added to queue: ${job.id}`}

    } catch (error: any) {
      logger.error(`QUEUE | POST ID: ${postId} | USER ID: ${userId} - ${error.message}`)
      return {success: false, message: `${error.message}`}
    }
  };


  export const editScheduledJob = async (postId: number, userId: number, scheduledAt: Date) => {
    try {

         // Convert scheduledAt to a Date object if it's not already
    const scheduledTime = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;

    if (isNaN(scheduledTime.getTime())) {
        logger.error(`Invalid scheduled time provided: ${scheduledAt}`);
        return {success: false, message: `Invalid scheduled time provided: ${scheduledAt}`};
      }

      const delay = scheduledTime.getTime() - new Date().getTime(); // Time difference in milliseconds
  
      if (delay <= 0) {
        logger.error(`QUEUE | POST ID: ${postId} | USER ID: ${userId} - Scheduled time must be in the future.`)
        return {success: false, message: `Scheduled time must be in the future.`};
      }
  
      logger.info(`QUEUE | POST ID: ${postId} | USER ID: ${userId} - Scheduling`)

      // Remove the old job
      const jobs = await postQueue.getJobs(["delayed"]);
      for (const job of jobs) {
          if (job.data.postId === postId) {
              await job.remove();
              break;
          }
      }
      
  
      // Add the job to the queue with a delay
      const job = await postQueue.add(
        "publishPost", // Job name
        { postId, userId }, // Data to pass to the worker
        { delay,
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: true,
         } // Delay in milliseconds
      );
      console.log(`Job added to queue: ${job.id}`);
      return {success: true, message: `Job added to queue: ${job.id}`}

    } catch (error: any) {
      logger.error(`QUEUE | POST ID: ${postId} | USER ID: ${userId} - ${error.message}`)
      return {success: false, message: `${error.message}`}
    }
  };


  export const deleteScheduleJob = async (postId: number, userId: number) =>{
    try {

      const jobs = await postQueue.getJobs(["delayed"]);
            for (const job of jobs) {
                if (job.data.postId === postId && job.data.userId === userId) {
                    await job.remove();
                    break;
                }
            }
        return {success: true, message: `Job removed from queue`}
    } catch (error: any) {
      logger.error(`QUEUE | POST ID: ${postId} | USER ID: ${userId} - ${error.message}`)
      return {success: false, message: `${error.message}`}
    }
  }
