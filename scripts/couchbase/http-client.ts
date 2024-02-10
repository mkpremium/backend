import axios from 'axios'

export const httpClient = axios.create({
  baseURL: 'http://localhost:8091/',
  auth: {
    username: 'couchbase',
    password: 'couchbase'
  },
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
})
