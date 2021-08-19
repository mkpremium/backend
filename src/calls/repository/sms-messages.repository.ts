import * as t from 'io-ts'
import { Errors } from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { TaskEither } from 'fp-ts/TaskEither'
import { taskEither } from 'fp-ts'
import { isRight } from 'fp-ts/Either'

export const SmsOutgoingMessageCodec = t.intersection([
  t.type({
    id: NonEmptyString,
    createdAt: DateFromISOString,
    callerId: NonEmptyString,
    contactId: NonEmptyString,
    ownerId: NonEmptyString,
    worksheetId: NonEmptyString,
    to: NonEmptyString,
  }),
  t.partial({
    direction: t.literal('outgoing'),
    _documentType: t.literal('owner-outgoing-sms'),
  })
])
export type SmsOutgoingMessage = Omit<t.TypeOf<typeof SmsOutgoingMessageCodec>, '_documentType' | 'direction'>

export class SmsMessagesRepository {
  constructor (
    private couchbaseAdapter: CouchbaseAdapter
  ) {
  }

  addOutgoing (sms: SmsOutgoingMessage): TaskEither<Errors | Error, void> {
    const encodedSms = SmsOutgoingMessageCodec.encode({
      ...sms,
      direction: 'outgoing',
      _documentType: 'owner-outgoing-sms',
    })

    return taskEither.tryCatch(
      () => this.couchbaseAdapter.insert(encodedSms.id, encodedSms),
      reason => new Error(String(reason)),
    )
  }

  getOutgoingSms (id: string): TaskEither<Errors | Error, SmsOutgoingMessage> {
    return taskEither.tryCatch(
      () => this.couchbaseAdapter.get(id)
        .then(({ value: sms }) => {
          const decodedSms = SmsOutgoingMessageCodec.decode(sms)
          if (!isRight(decodedSms)) {
            return Promise.reject(decodedSms.left)
          }
          return decodedSms.right
        }),
      reason => reason instanceof Error ? reason : new Error(String(reason))
    )
  }
}
