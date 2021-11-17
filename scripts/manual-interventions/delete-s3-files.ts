import aws from 'aws-sdk'
import * as fs from 'fs'

const s3client = new aws.S3({ region: 'eu-west-2' })
fs.readFile(process.env.FILES_TO_DELETE_PATH, 'utf8', async (error, data) => {
  if (error) {
    console.error('Error reading file', error.message)
    process.exit(1)
  }
  const filesToDelete = data.split('\n')
  console.log('files to delete', filesToDelete.length)
  for (const key of filesToDelete) {
    await s3client.deleteObject({
      Bucket: 'mkpremium-files',
      Key: key,
    }).promise().then(() => {
      console.info({ key })
    }).catch(error => {
      console.error({ error: error.message, key })
    })
  }
  process.exit()
})
