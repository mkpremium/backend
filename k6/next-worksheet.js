import http from 'k6/http'
import { check } from 'k6'

export default function () {
  const worksheetUrl = 'https://api.mkpremium.net/caller/next-worksheet'

  const authenticatedParams = {
    headers: {
      Authorization: `Bearer ${__ENV.AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }

  const worksheetRes = http.post(worksheetUrl, null, authenticatedParams)

  check(worksheetRes, {
    'worksheet request successful': (r) => r.status === 200,
    'at least one related_owner with non-BAD status': (r) => {
      const data = r.json()
      return data.relatedOwners.filter(
        owner => owner.person.contacts.filter(({ status }) => status !== 'BAD').length > 0
      ).length > 0
    }
  })
}
