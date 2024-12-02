import AWS from 'aws-sdk';
import { v4 as uuid_v4 } from 'uuid';
import logger from './logger';
const path = require('path');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const bucket = process.env.NODE_ENV === 'production' ? process.env.AWS_S3_BUCKET_PROD : process.env.AWS_S3_BUCKET_DEV;

/**
 * Function to check if a bucket exists and create it if it doesn't.
 * @param {string} bucketName - The name of the bucket to check/create.
 */
const ensureBucketExists = async (bucketName: string) => {
    try {
      // Check if the bucket exists
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`Bucket "${bucketName}" already exists.`);
      logger.info(`AWS S3 BUCKET ${bucketName} SUCCEED - already exists.`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Bucket does not exist; create it
        console.log(`Bucket "${bucketName}" does not exist. Creating it...`);
        logger.info(`AWS S3 BUCKET ${bucketName} FAILED - ${bucketName} not exist. Creating it...`);
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`Bucket "${bucketName}" created successfully.`);
        logger.info(`AWS S3 BUCKET ${bucketName} SUCCEED - created successfully.`);
      } else {
        console.error(`Error checking bucket: ${error.message}`);
        logger.error(`AWS S3 BUCKET ${bucketName} FAILED - creation failed - ${error.message}`);
        throw error;
      }
    }
  };


const uploadFileToS3 = async (file: Express.Multer.File, folderName: string) => {
    try {
  
      // Generate a unique file name
      const uniqueFileName = `${folderName}/${new Date().getTime().toString()}-${file.originalname}`;

      // Ensure bucket exists
    await ensureBucketExists(bucket || "s3-nerddnest-dev");
  
      // S3 upload parameters
      const params = {
        Bucket: bucket || "s3-nerddnest-dev",
        Key: uniqueFileName, // Path in the bucket
        Body: file.buffer, // File buffer
        ContentType: file.mimetype, // File type
        // ACL: 'public-read', // Make file public
      };
  
      // Upload the file
      const data = await s3.upload(params).promise();
      console.log(data.Location)
      return data.Location ;
    } catch (error: any) {
      console.error('Error uploading file to S3:', error.message);
      return  null;
    }
  };


  const deleteFileFromS3 = async (fileUrl: string) => {
    const bucketName = bucket || "s3-nerddnest-dev";
  
    const key = fileUrl.split(`${bucketName}/`)[1];
    await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
  };

  export {uploadFileToS3, deleteFileFromS3}