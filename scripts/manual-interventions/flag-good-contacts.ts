import axios from 'axios'
import fs from 'fs'

const httpClient = axios.create({
  headers: {
    'Authorization': `Bearer ${process.env.TOKEN}`,
  },
  baseURL: 'https://api.mkpremium.net',
})
const contacts: { contactId: string; ownerId: string }[] = JSON.parse(fs.readFileSync(process.env.CONTACTS_PATH).toString('utf8'))
new Promise(async resolve => {
  const counter = {
    success: 0,
    failures: 0,
  }
  for (const { contactId, ownerId } of contacts) {
    try {
      await httpClient.put(`/owners/${ownerId}/contacts/${contactId}/status`, { status: 'GOOD' })
      counter.success++
      console.info('.')
    } catch (error) {
      console.error('Request failed', { ownerId, contactId, error })
      counter.failures++
    }
  }

  resolve(counter)
}).then((counter) => {
  console.info('Done!', counter)
  process.exit(0)
}).catch(error => {
  console.error(error)
  process.exit(1)
})
