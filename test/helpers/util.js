/**
 *
 * @param description
 * @param value
 */
export function prettyPrint (description, value) {
  console.log(description, JSON.stringify(value, null, 2))
}

export async function catchError (fn) {
  let error = null
  let res = null

  await Promise.resolve(fn)
    .then(r => {
      res = r
    })
    .catch(err => {
      error = err
    })

  return { error, res }
}
