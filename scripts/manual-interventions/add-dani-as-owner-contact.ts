import owners from '../../worksheets/lisboa_owners.json'
import axios from 'axios'

const daniContact = {
  status: 'UNDEFINED',
  type: 'TELEFONO',
  value: '912078192'
  // value: '634531701'
}

const httpClient = axios.create({
  headers: {
    'Authorization': `Bearer ${process.env.TOKEN}`,
  },
  baseURL: 'https://api.mkpremium.net',
})

new Promise(async resolve => {
  const counter = {
    success: 0,
    failures: 0,
  }
  for (const owner of owners) {
    try {
      await httpClient.post(`/owners/${owner.id}/contacts`, daniContact)
      counter.success++
      console.info('.')
    } catch (error) {
      console.error('Request failed', { ownerId: owner.id, error })
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

