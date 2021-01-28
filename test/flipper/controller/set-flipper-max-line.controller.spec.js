import { expect } from 'chai'
import { stub, spy } from 'sinon'

const { createSetFlipperMaxLineController } = require('../../../src/flipper/controller/set-flipper-max-line.controller')

describe('set-flipper-max-line.controller', () => {
  let controller
  let setFlipperMaxLineServiceStub
  beforeEach(() => {
    setFlipperMaxLineServiceStub = { setFlipperMaxLine: stub() }

    controller = createSetFlipperMaxLineController({ setFlipperMaxLineService: setFlipperMaxLineServiceStub })
  })

  it('sets flippers max line', () => {
    const testMaxLine = 1000000
    const testRequest = {
      params: {
        flipperId: 'test-flipper-id'
      },
      body: {
        maxLine: testMaxLine
      }
    }
    const testResponse = { json: spy() }

    setFlipperMaxLineServiceStub.setFlipperMaxLine.resolves()
    return controller(testRequest, testResponse).then(() => {
      expect(testResponse.json).to.have.been.called
      expect(setFlipperMaxLineServiceStub.setFlipperMaxLine).to.have.been.calledWith('test-flipper-id', testMaxLine)
    })
  })
})
