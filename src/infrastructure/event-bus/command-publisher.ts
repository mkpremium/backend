import { Id, Identifiable } from '../postgres/save-documents-command-handler'
import { SQS } from 'aws-sdk'
import _ from 'lodash'
import { Logger } from 'winston'

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 1_000

export class CommandPublisher {
  private buffer: Id[] = []
  private isBatchSendingInProgress = false

  constructor (
    private sqs: SQS,
    private queueUrl: string,
    private listener: string,
    private logger: Logger,
    private addOnly: boolean,
    private fromCouchbase: string
  ) {
  }

  async push (obj: Identifiable) {
    this.buffer.push(obj.id)
    const bufferLength = this.buffer.length
    if (bufferLength >= BATCH_SIZE) {
      if (this.isBatchSendingInProgress) {
        this.logger.warning('Batch sending in progress, not sending next batch')
        return
      }
      this.logger.info('Publishing next batch', { bufferSize: bufferLength })
      const nextBatch = this.buffer.splice(0, BATCH_SIZE)
      await this.publishBatch(nextBatch)
    }
  }

  async flushPendingMessages (retries = 3) {
    if (this.isBatchSendingInProgress) {
      if (retries === 0) {
        throw new Error('Couldn\'t flush pending messages')
      }

      this.logger.warning('Batch sending in progress, waiting 500ms before trying again')
      return new Promise(resolve => setTimeout(resolve, 500))
        .then(() => this.flushPendingMessages(retries - 1))
    }

    while (this.buffer.length > 0) {
      const nextBatch = this.buffer.splice(0, BATCH_SIZE)
      await this.publishBatch(nextBatch)
    }
  }

  async publishBatch (batch: Id[]) {
    this.isBatchSendingInProgress = true
    const chunks = _.chunk(batch, BATCH_SIZE / 10)
    try {
      const command = 'postgres.save_documents_command'
      return await this.sqs.sendMessageBatch({
        QueueUrl: this.queueUrl,
        Entries: chunks.map((chunk, idx) => ({
          Id: `chunk-${idx}`,
          MessageBody: JSON.stringify({
            listener: this.listener,
            event: {
              name: command,
              addOnly: this.addOnly,
              fromCouchbase: this.fromCouchbase,
              ids: chunk
            }
          })
        }))
      }).promise().then(batchResult => {
        batchResult.Failed.forEach(console.error)
      })
    } finally {
      this.isBatchSendingInProgress = false
    }
  }
}
