import * as t from 'io-ts'
import { date, NonEmptyString } from 'io-ts-types'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { TaskEither } from 'fp-ts/TaskEither'
import { Errors } from 'io-ts'
import { task, taskEither } from 'fp-ts'

const SMSMessageCodec = t.type({
  id: NonEmptyString,
  createdAt: date,
  callerId: NonEmptyString,
  contactId: NonEmptyString,
  ownerId: NonEmptyString,
  worksheetId: NonEmptyString,
})

export type SMSMessage = t.TypeOf<typeof SMSMessageCodec>

export class SmsMessagesRepository {
  constructor (
    private couchbaseAdapter: CouchbaseAdapter
  ) {
  }

  add(sms: SMSMessage): TaskEither<Errors | Error, void> {
    return taskEither.left(new Error('Not implemented'))
  }
}
