import { SQS } from 'aws-sdk'
import fs from 'fs'
import path from 'path'

const sqsClient = new SQS({
  region: 'eu-west-1',
})
const QUEUE_URL = process.env.QUEUE_URL
const parsedQueueUrl = new URL(QUEUE_URL)
const queueName = parsedQueueUrl.pathname.split('/').pop()
const dateString = new Date().toISOString().replace(/[-:]/g, '_').substring(0, 19)
const dirPath = path.join(__dirname, `messages_${dateString}_${queueName}`)

if (!QUEUE_URL) {
  throw new Error('Missing QUEUE_URL environment variable.')
}

fs.mkdir(dirPath, { recursive: true }, (error) => {
  if (error) {
    console.error('An error occurred while creating the directory:', error)
    process.exit(1)
  } else {
    console.log('Directory created successfully:', dirPath)
    readMessages()
  }
})

function readMessages () {
  sqsClient.receiveMessage({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10, // You can adjust this value
    WaitTimeSeconds: 20 // Long polling
  }, (err, data) => {
    if (err) {
      console.log('Receive Error', err)
    } else if (data.Messages) {
      if (data.Messages.length === 0) {
        console.log('No messages left')
        process.exit()
      }
      data.Messages.forEach((message) => {
        const filePath = path.join(dirPath, `${message.MessageId}.json`)
        fs.writeFile(filePath, JSON.stringify(message), (err) => {
          if (err) {
            console.error('An error occurred while writing the file:', err)
          } else {
            console.log(`Message saved successfully: ${filePath}`)
            const deleteParams = {
              QueueUrl: QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle
            }
            sqsClient.deleteMessage(deleteParams, (err, data) => {
              if (err) {
                console.log('Delete Error', err)
              } else {
                console.log('Message Deleted', data)
              }
            })
          }
        })
      })
      console.log('Batch of messages read, waiting before reading next batch...')
      setTimeout(readMessages, 1000)
    }
  })
}
