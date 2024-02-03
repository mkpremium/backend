import { SQS } from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import util from 'util';

const sqsClient = new SQS({ region: 'eu-west-1' });
const QUEUE_URL = process.env.QUEUE_URL; // Replace with your SQS Queue URL
const MESSAGES_DIR = process.env.MESSAGES_DIR;

if (!QUEUE_URL) {
  throw new Error('Missing QUEUE_URL environment variable.');
}

if (!MESSAGES_DIR) {
  throw new Error('Missing MESSAGES_DIR environment variable.');
}

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

async function sendMessages() {
  const files = await readdir(MESSAGES_DIR);

  for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const message = JSON.parse(content);

    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: message.Body,
    };

    try {
      const data = await sqsClient.sendMessage(params).promise();
      console.log(`Message sent successfully: ${data.MessageId}`);
    } catch (err) {
      console.error(`An error occurred while sending the message: ${err}`);
    }
  }
}

sendMessages();
