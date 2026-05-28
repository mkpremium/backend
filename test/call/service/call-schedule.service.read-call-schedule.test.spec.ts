import { expect } from 'chai'
import sinon from 'sinon'
import { CallScheduleService } from '../../../src/call/service/call-schedule.service'
0
describe('CallScheduleService.readCallSchedule', () => {
  let callScheduleService: CallScheduleService
  let callService: any
  let logger: any
  let callScheduleRepository: any

  beforeEach(() => {
    callService = {
      processNextBuilding: sinon.stub()
    }
    logger = {
      info: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }

    callScheduleRepository = {
      getAll: sinon.stub()
    }

    callScheduleService = new CallScheduleService(
      callService as any,
      logger as any,
      callScheduleRepository as any
    )
  })

  afterEach(() => {
    sinon.restore()
  })

  it('returns error when there are no schedules', async () => {
    callScheduleRepository.getAll.resolves([])

    const result = await callScheduleService.readCallSchedule()
    expect(result?.status).to.equal('error')
    expect(result?.message).to.equal('No hay lista de planificación')
    sinon.assert.calledOnce(callScheduleRepository.getAll)
    sinon.assert.notCalled(callService.processNextBuilding)
  })

  it('does not process schedule when current day is not valid', async () => {
    callScheduleRepository.getAll.resolves([
      {
        city: 'MADRID',
        days: '2-5'
      }
    ])

    const result = await callScheduleService.readCallSchedule()

    expect(result?.status).to.equal('ok')

    sinon.assert.calledOnce(callScheduleRepository.getAll)

    sinon.assert.notCalled(callService.processNextBuilding)

    sinon.assert.calledWith(

      logger.info,

      'Hoy no toca ejecutar llamadas para MADRID'
    )
  })

  it('calls processNextBuilding when current day is valid', async () => {
    callScheduleRepository.getAll.resolves([
      {
        city: 'MADRID',
        days: '1-5'
      }
    ])

    callService.processNextBuilding.resolves({
      status: 'ok'
    })

    const result = await callScheduleService.readCallSchedule()
    expect(result?.status).to.equal('ok')
    expect(result?.message).to.equal('Planificaciones procesadas')
    sinon.assert.calledOnceWithExactly(
      callService.processNextBuilding,
      'MADRID'
    )
  })

  it('logs empty when processNextBuilding returns empty', async () => {
    callScheduleRepository.getAll.resolves([
      {
        city: 'MADRID',
        days: '1-5'
      }
    ])

    callService.processNextBuilding.resolves({
      status: 'empty',
      message: 'No quedan edificios pendientes'
    })

    const result = await callScheduleService.readCallSchedule()
    expect(result?.status).to.equal('ok')
    sinon.assert.calledOnceWithExactly(
      callService.processNextBuilding,
      'MADRID'
    )
    sinon.assert.calledWith(
      logger.info,
      'No quedan contactos pendientes para MADRID'
    )
  })

  it('logs finished when processNextBuilding returns finished', async () => {
    callScheduleRepository.getAll.resolves([
      {
        city: 'MADRID',
        days: '1-5'
      }
    ])
    callService.processNextBuilding.resolves({
      status: 'finished',
      message: 'Límite diario alcanzado'
    })
    const result = await callScheduleService.readCallSchedule()
    expect(result?.status).to.equal('ok')
    sinon.assert.calledOnceWithExactly(
      callService.processNextBuilding,
      'MADRID'
    )
    sinon.assert.calledWith(
      logger.info,
      'Ya se gestionaron todos los edificios del día para MADRID'
    )
  })

  it('processes only schedules with valid day', async () => {
    callScheduleRepository.getAll.resolves([
      {
        city: 'MADRID',
        days: '1-5'
      },
      {
        city: 'BARCELONA',
        days: '2-5'
      },
      {
        city: 'VALENCIA',
        days: '1-5'
      }
    ])
    callService.processNextBuilding.resolves({
      status: 'ok'
    })
    const result = await callScheduleService.readCallSchedule()
    expect(result?.status).to.equal('ok')
    sinon.assert.calledTwice(callService.processNextBuilding)
    sinon.assert.calledWithExactly(
      callService.processNextBuilding.firstCall,
      'MADRID'
    )
    sinon.assert.calledWithExactly(
      callService.processNextBuilding.secondCall,
      'VALENCIA'
    )
    sinon.assert.calledWith(
      logger.info,
      'Hoy no toca ejecutar llamadas para BARCELONA'
    )
  })

  it('returns error when repository throws error', async () => {
    callScheduleRepository.getAll.rejects(new Error('DB error'))
    const result = await callScheduleService.readCallSchedule()
    expect(result?.status).to.equal('error')
    expect(result?.message).to.equal('Error leyendo planificación de llamadas')
    sinon.assert.calledOnce(callScheduleRepository.getAll)
    sinon.assert.notCalled(callService.processNextBuilding)
    sinon.assert.calledWith(logger.error, 'DB error')
  })
})
