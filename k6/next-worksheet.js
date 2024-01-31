import http from 'k6/http'
import { Rate } from 'k6/metrics'

const baseAPIUrl = 'http://localhost:9001'

const failRate = new Rate('failed requests')

export const options = {
  thresholds: {
    'failed requests': ['rate<0.1'],
    http_req_duration: ['p(95)<500']
  }
}

export function setup () {
  const res = http.post(`${baseAPIUrl}/operators/login`, JSON.stringify({
    username: 'test',
    password: 'testtest'
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (res.status !== 200) {
    console.error('login error', JSON.stringify(res))
    throw new Error('Login failed!')
  }
  const { token } = res.json()

  return { token }
}

export default function ({ token }) {
  // const nbOfBuildings = 100
  // for (let i = 0; i < nbOfBuildings; i++) {
  //   const res = http.post(`${baseAPIUrl}/test-harness/create-building`, {}, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${token}`
  //     }
  //   })
  //   if (res.status !== 200) {
  //     console.error('creating building', JSON.stringify(res))
  //     throw new Error('Building creation failed!')
  //   }
  // }

  const res = http.post(`${baseAPIUrl}/caller/next-worksheet`, {}, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    timeout: 5000
  })

  failRate.add(res.status !== 200)
}
