import { Worker } from "bullmq";
import RedisConn from '../redis-connection';
import logger from "../../logger";
import Posts from "../../../db/models/posts.model";


RedisConn.ping((err, res) => {
    if (err) console.error("Redis connection error:", err);
    else console.log("Redis connected:", res);
  });

  console.log("Worker initialized for queue: postsQueue");
  
const publishPost = async (job: any) =>{
    const { postId, userId } = job.data;
    try {
     // Update the post to mark it as published
     const post = await Posts.findOne({
        where:{
            id: postId,
            user_id: userId
        }
     });

     if (!post) {
       console.error(`Post with ID ${postId} not found.`);
       return;
     }
 
     if (post.is_published) {
       console.log(`Post ${postId} is already published.`);
       return;
     }
 
     // Publish the post
     post.is_published = true;
     await post.save();
 
     console.log(`Post ${postId} published successfully!`);
     logger.info(`WEB WORKER | POST ID: ${postId} | USER ID: ${userId} - PUBLISHED SUCCESSFULLY`)
    } catch (error: any) {
        console.error(`Job ${job.id} failed: ${error.message}`); 
        logger.error(`WEB WORKER | POST ID: ${postId} | USER ID: ${userId} - PUBLISHED FAILED - ERROR: ${error.message}`)  
    }
}

const jobHandlers: any = {
    publishPost: publishPost,
  };


const postWorker = new Worker(
    "postsQueue",
    async (job: any) => {
        console.log(`Job received: ${job.name}, Data: ${JSON.stringify(job.data)}`);
        const handler = jobHandlers[job.name];
        if (handler) {
            await handler(job);
        } else {
            console.error(`No handler for job: ${job.name}`);
        }
    },
    { connection: RedisConn }
);

Worker.prototype.on("error", (error) => console.error("Worker Error:", error));

postWorker.on("stalled", (job: any) => {
    console.warn(`Job ${job.id} stalled.`);
});


postWorker.on("progress", (job, progress) => {
    console.log(`Job ${job.id} progress: ${progress}`);
});

postWorker.on("ready", () => {
    console.log("Worker is ready and listening to the queue.");
    });

postWorker.on("active", (job) => {
    console.log(`Worker processing job: ${job.id}`);
    });


// Log worker events for debugging
postWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed!`);
    logger.info(`WEB WORKER | JOB ID: ${job.id} | JOB NAME: ${job.name} PROCESS COMPLETED`)
  });
  
postWorker.on("failed", (job: any, err: any) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
    logger.error(`WEB WORKER | JOB ID: ${job.id} | JOB NAME: ${job.name} PROCESS FAILED - ERROR: ${err.message}`)
});
  
export default postWorker;