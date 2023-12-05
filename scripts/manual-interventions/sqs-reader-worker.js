const { Person } = require('../../src/owner/owner')

const AWS = require('aws-sdk')
const Promise = require('bluebird')
const { connectCouchbaseBucket } = require('../../src/db/connect-couchbase-bucket')
const t = require('tcomb')
const { createLegacyDependenciesContainer } = require('../../src/infrastructure/dependencies')

AWS.config.update({ region: 'eu-west-1' })
const sqsClient = Promise.promisifyAll(new AWS.SQS(), { suffix: 'Promise' })

const queueUrl = 'https://sqs.eu-west-1.amazonaws.com/173249668334/owners-to-update.fifo'

const personInfoQuery = `
    SELECT person.id,
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
const maxEmptyPolls = process.env.MAX_EMPTY_POLLS || 3
const app = { locals: {} }

const NO_MESSAGES = 'NO-MESSAGES'

connectCouchbaseBucket()
  .then(cbBucket => {
    const legacyDependenciesContainer = createLegacyDependenciesContainer(cbBucket)
    return { cbBucket, legacyDependenciesContainer }
  })
  .then(
    async ({ cbBucket, legacyDependenciesContainer }) => {
      let nbOfProcessedMessages = 0
      let emptyPolls = 0

      while (true) {
        const maxNumberOfMessages = Math.min(maxMessagesToProcess - nbOfProcessedMessages, 10)
        const result = await pollForMessages(maxNumberOfMessages)
        emptyPolls = result === NO_MESSAGES ? emptyPolls + 1 : 0
        if (emptyPolls >= maxEmptyPolls) {
          console.info(`${emptyPolls} empty polls received, exiting`)
          process.exit()
        }

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
        return sqsClient.receiveMessagePromise({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: maxNumberOfMessages,
            WaitTimeSeconds: 20
          })
          .then(result => {
            if (!result.Messages) {
              console.info('no messages received, exiting')
              return NO_MESSAGES
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
          console.info('skipping owner with already embed person', { ownerId })
          return
        }
        if (!owner.personId) {
          console.info('skipping owner without personId', { ownerId })
          return
        }

        const person = await cbBucket.queryAsync(personInfoQuery, [ ownerId ])

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
    console.error('error connecting to couchbase', { error })
    process.exit(1)
  })
