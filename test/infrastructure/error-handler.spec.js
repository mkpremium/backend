import t from 'tcomb'
import { inferStatusCode } from '../../src/infrastructure/error-handler'
import { expect } from 'chai'
import { newHttpError } from '../../src/lib/http-error'

describe('inferStatusCode', function () {
  it('infers client error on tcomb type errors', function () {
    let tcombError
    try {
      t.fail('some type check error')
    } catch (err) {
      tcombError = err
    }

    expect(inferStatusCode(tcombError)).to.be.equal(400)
  })

  it('infers code in HTTP error', function () {
    const httpError = newHttpError(422, 'some error')

    expect(inferStatusCode(httpError)).to.be.equal(422)
  })

  it('takes code from express error status field', function () {
    const expressError = new Error('supposed jwt error')
    expressError.status = 406

    expect(inferStatusCode(expressError)).to.be.equal(406)
  })
})
