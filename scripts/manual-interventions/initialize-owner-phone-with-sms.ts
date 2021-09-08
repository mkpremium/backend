import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import lastWeekSms from './sms_week.json'
import { promisifyAll } from 'bluebird'

connectCouchbaseBucket()
  .then(async bucket => {
    const promisifiedBucket: any = promisifyAll(bucket)
    for (const sms of lastWeekSms) {
      const id = `owner_phone_${sms.to}`
      const now = new Date()
      try {
        await promisifiedBucket.insertAsync(id, {
          id,
          phoneNumber: sms.to,
          createdAt: now,
          updatedAt: now,
          _documentType: 'building-owner-phone',
          lastSmsSentAt: sms.createdAt,
          lastSmsSentId: sms.id
        })
      } catch (error) {
        if (error.code !== 12) {
          throw error
        }
      }
    }
  })
  .then(() => process.exit())
  .catch(error => {
    console.error(error, error.stack)
    process.exit(1)
  })
