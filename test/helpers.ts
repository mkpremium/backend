import * as TE from 'fp-ts/TaskEither'
import { expect } from 'chai'

export function orFail() {
  return TE.orElse((error) => {
    expect.fail(String(error))
  })
}
