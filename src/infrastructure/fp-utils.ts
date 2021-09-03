import { TaskEither } from 'fp-ts/TaskEither'
import { taskEither } from 'fp-ts'

export function fromPromise<A, E extends Error>(
  p: Promise<A>,
): TaskEither<E | Error, A> {
  return taskEither.tryCatch(
    () => p,
    (reason) => (reason instanceof Error ? reason : new Error(String(reason))),
  )
}
