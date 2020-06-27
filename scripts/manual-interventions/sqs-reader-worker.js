const { Person } = require('../../src/types/owner')

const { config } = require('dotenv')
config()

const AWS = require('aws-sdk')
const Promise = require('bluebird')
const { N1qlQuery } = require('couchbase')
const couchbase = require('../../src/db/couchbase').default
const t = require('tcomb')
const { createLegacyDependenciesContainer } = require('../../src/infrastructure/dependencies')

AWS.config.update({ region: 'eu-west-1' })
const sqsClient = Promise.promisifyAll(new AWS.SQS(), { suffix: 'Promise' })

const queueUrl = 'https://sqs.eu-west-1.amazonaws.com/173249668334/owners-to-update.fifo'

const personInfoQuery = `
SELECT
  person.id,
  person.name,
  person.firstName,
  person.contacts,
  person.documentNumber,
  person.addresses
FROM mkpremium owner
JOIN mkpremium person ON person.id = owner.personId AND person._documentType = "person"
WHERE owner._documentType = "owner" AND owner.id = $1
`

const maxMessagesToProcess = process.env.MAX_MESSAGES_TO_PROCESS || 1000
const app = { locals: {} }

couchbase(app)
  .then(cbBucket => {
    const legacyDependenciesContainer = createLegacyDependenciesContainer(cbBucket)
    return { cbBucket, legacyDependenciesContainer }
  })
  .then(
    async ({ cbBucket, legacyDependenciesContainer }) => {
      let nbOfProcessedMessages = 0
      while (true) {
        const maxNumberOfMessages = Math.min(maxMessagesToProcess - nbOfProcessedMessages, 10)
        await pollForMessages(maxNumberOfMessages)
        await new Promise(resolve => {
          setTimeout(resolve, 200)
        })
        nbOfProcessedMessages += maxNumberOfMessages

        if (nbOfProcessedMessages >= maxMessagesToProcess) {
          console.info(`exiting after process ${nbOfProcessedMessages}`)
          process.exit()
        }
      }

      function pollForMessages (maxNumberOfMessages = 10) {
        return sqsClient.receiveMessagePromise({ QueueUrl: queueUrl, MaxNumberOfMessages: maxNumberOfMessages, WaitTimeSeconds: 5 })
                        .then(result => {
                          if (!result.Messages) {
                            console.info('no messages received, exiting')
                            process.exit()
                          }

                          return Promise.all(result.Messages.map(async (msg) => {
                            const { ownerId } = JSON.parse(msg.Body)

                            try {
                              await embedPersonalInfoIntoOwner(ownerId)
                            } catch (error) {
                              console.error('error saving personal data', { ownerId, error })
                              return
                            }

                            console.info('Personal info saved in owner', { ownerId })

                            return sqsClient.deleteMessagePromise({
                              QueueUrl: queueUrl,
                              ReceiptHandle: msg.ReceiptHandle
                            }).catch(error => {
                              console.error('error deleting message', { error, id: msg.MessageId })
                            })
                          }))
                        })
                        .catch(error => {
                          console.error('error receiving message', { error })
                          process.exit(1)
                        })
      }

      async function embedPersonalInfoIntoOwner (ownerId) {
        const { ownerRepository } = legacyDependenciesContainer
        const owner = await ownerRepository.findById(ownerId)
        if (owner.person) {
          console.info('skipping owner with already embed person', {ownerId})
          return
        }

        const person = await cbBucket.queryAsync(
          N1qlQuery.fromString(personInfoQuery),
          [ ownerId ]
        )

        const updatedOwner = t.update(owner, {
          $merge: {
            person: Person(person[ 0 ])
          }
        })

        await ownerRepository.save(updatedOwner)
      }
    }
  )
  .catch(error => {
    console.error('error connecting to couchbase', {error})
    process.exit(1)
  })
