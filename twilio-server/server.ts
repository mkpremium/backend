import express from 'express'
import bodyParser from 'body-parser'
import faker from 'faker/locale/es'
import axios from 'axios'

const server = express()

server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json())

server.use((req, res) => {
  const { StatusCallback } = req.body
  res.json({})

  const delaySeconds = faker.datatype.number(10)
  setTimeout(async () => {
    const CallStatus = faker.helpers.randomize([ 'completed', 'failed', 'no-answer', 'busy' ])
    await axios.post(StatusCallback, { CallStatus })
  }, 1000 * delaySeconds)
})

const port = process.env.PORT || '4545'
server.listen(port, () => {
  console.log(`Twilio mock server listening at http://localhost:${port}`)
})
