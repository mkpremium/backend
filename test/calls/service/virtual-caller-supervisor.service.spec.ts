import { expect } from 'chai'
import sinon, { SinonFakeTimers, spy, stub } from 'sinon'
import {
  CheckCommand,
  VirtualCallerSupervisorService
} from '../../../src/calls/service/virtual-caller-supervisor.service'
import moment from 'moment-timezone'
import { ContactsOrderStrategy } from '../../../src/calls/service/virtual-caller.service'
import { virtualCallerBuilder } from '../virtual-caller.builder'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'
import { relatedOwnerBuilder } from '../../worksheet/related-owner.builder'
import { CallcenterView, WorksheetBuilding } from '../../../src/worksheet/repository/worksheet.repository'

const testCmd: CheckCommand = {
  caller: virtualCallerBuilder({
    id: 'test-caller-id',
    queueId: 'test-queue-id',
    isEnabled: true,
  }).build(),
  maxWorksheets: 100,
  lastWorksheetId: undefined,
  lastOwnerResponse: undefined,
}

describe('VirtualCallerSupervisorService', () => {
  let service!: VirtualCallerSupervisorService
  let virtualCallerStub
  let virtualCallerWorksheetsRepositoryStub
  let loggerSpy
  let eventBusStub
  let clock: SinonFakeTimers

  beforeEach(() => {
    virtualCallerStub = {
      processNextWorksheet: stub(),
    }
    virtualCallerWorksheetsRepositoryStub = {
      numberOfWorksheetsProcessedBy: stub(),
    }
    eventBusStub = {
      publish: stub(),
    }
    loggerSpy = {
      info: spy(),
    }

    service = new VirtualCallerSupervisorService(
      virtualCallerStub,
      virtualCallerWorksheetsRepositoryStub,
      eventBusStub,
      loggerSpy,
    )

    const lastMondayMorning = moment().startOf('isoWeek').hours(9).minutes(0)
    clock = sinon.useFakeTimers(lastMondayMorning.toDate())
  })

  afterEach(() => clock.restore())

  it('makes virtual caller process next worksheet', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.caller.queueId).resolves(0)

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet.lastCall.firstArg).to.include({
      caller: testCmd.caller,
    })
  })

  it('does not check for max worksheets when no maximum is setup', async () => {
    await service.check({ ...testCmd, maxWorksheets: undefined })

    expect(virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy).to.not.have.been.called
  })

  it('does not invoke virtual caller when max worksheets have been processed', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.caller.id)
      .resolves(testCmd.maxWorksheets)

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.not.have.been.called
    expect(loggerSpy.info).to.have.been.called
  })

  it('does not invoke virtual caller outside scheduled hours', async () => {
    clock.restore()
    clock = sinon.useFakeTimers(moment().startOf('isoWeek').hours(20).minutes(1).toDate())

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.not.have.been.called
    expect(loggerSpy.info).to.have.been.called
  })

  it('does not invoke disabled virtual caller', async () => {
    await service.check({ ...testCmd, caller: { ...testCmd.caller, isEnabled: false } })

    expect(virtualCallerStub.processNextWorksheet).to.not.have.been.called
    expect(loggerSpy.info).to.have.been.called
  })

  describe('contactsOrderStrategy', () => {
    let contactsOrderStrategy: ContactsOrderStrategy

    beforeEach(async () => {
      virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.caller.id).resolves(0)
      await service.check(testCmd)
      eventBusStub.publish.resolves()

      contactsOrderStrategy = virtualCallerStub.processNextWorksheet.lastCall.firstArg.contacts
    })

    it('does not give duplicated numbers within same owner', () => {
      const testWorksheet = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            id: 'test-owner-id',
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
        ],
      }).build()
      const contacts = contactsOrderStrategy(testWorksheet)

      expect(contacts).to.be.eql([ {
        ownerId: 'test-owner-id',
        id: 'test-first-contact-id',
        status: 'UNDEFINED',
        type: 'TELEFONO',
        value: '666666666',
      } ])
    })

    it('debug', () => {
      const ws =         {
        "building": {
          "address": {
            "city": "BARCELONA",
            "fullAddress": "CL MIQUEL ANGEL 81, BARCELONA",
            "neighborhood": "SANTS",
            "number": 81,
            "postalCode": {
              "number": "08028",
              "verified": true
            },
            "province": "BARCELONA",
            "registerNumber": 14,
            "street": "MIQUEL ANGEL",
            "type": "CL",
            "zone": "SANTS  #  SANTS-MONTJUÏC"
          },
          "cadastre": {
            "address": "CL MIQUEL ANGEL 81",
            "reference": "7411428DF2871A0001GI"
          },
          "cadastreReference": "7411428DF2871A0001GI",
          "featuredOwnerId": "40d608b5-d1a1-481a-aa49-99efeff40e4d",
          "floorArea": 181,
          "id": "c65890e0-0f9f-4b7b-a1b7-bc308937e1a4",
          "location": {
            "lat": 41.3772518,
            "lng": 2.131461
          },
          "metadata": [
            {
              "id": "e97a03b8-9356-4dec-90ef-1240aab3e446",
              "mimeType": "image/jpeg",
              "name": "7411428DF2871A0001GI.jpg",
              "previewUrl": "https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/05fdc7fd-1a63-4551-bb3a-189b4c688f6a.jpg"
            },
            {
              "id": "11ea8dca-c065-4b44-90ab-6934d82a0cb9",
              "mimeType": "application/pdf",
              "name": "7411428DF2871A0001GI.pdf",
              "previewUrl": "https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/1b7b1b0c-0972-435d-bbe7-2fe694bfe317.jpg"
            }
          ],
          "negotiationStatus": "LEAD",
          "recentProposal": {
            "_documentType": "building-proposal",
            "aspiration": null,
            "buildingId": "c65890e0-0f9f-4b7b-a1b7-bc308937e1a4",
            "createdAt": "2021-06-23T11:04:31.382Z",
            "createdBy": "d3d57911-41d7-44c6-83c6-420cd0db9116",
            "id": "e082de6e-9a68-415d-9e5d-4a42daac1660",
            "message": "Estimados propietarios, <br/> <br/>Despues de un estudio en profundidad junto con nuestro equipo tecnico, adjuntamos oferta de compra de la finca situada en: <br/><br/> CL MIQUEL ANGEL 81, BARCELONA. <br/><br/>En el caso de aceptación por su parte, póngase en contacto con nosotros para formalizar el compromiso de la compraventa de dicha finca.  <br/> <br/>Para cualquier duda o aclaración quedo a su disposición.  <br/> <br/>Cordialmente,  <br/> <br/>Deyvi Carril <br/>Dep. de Adquisiciones</br><img src=\"https://app.mkpremium.net/static/firma_MK.jpg\" />",
            "notificationEmail": "paul.capriotti@hotmail.com",
            "notificationSentAt": null,
            "notificationStatus": "PENDING",
            "ownerId": "40d608b5-d1a1-481a-aa49-99efeff40e4d",
            "proposal": 250000,
            "state": "pendiente",
            "updatedAt": null
          },
          "usage": "Residencial",
          "use": "Residencial"
        },
        "id": "454adae2-6261-4df3-9fb5-c084a8a56b9e",
        "queueId": "e1748e7d-8714-45c0-a831-c0f42d6d564f",
        "relatedOwners": [
          {
            "featuredContact": {
              "emailId": null,
              "phoneId": "12d76f1c-64c7-453b-a760-afbf88d45791"
            },
            "id": "d6fa1439-b059-4802-9584-ca70bc36a668",
            "name": "CAPRIOTTI PERI VICENTE PAUL",
            "person": {
              "contacts": [
                {
                  "id": "2296082a-681a-4ff7-a577-1e1bd7c77c67",
                  "note": null,
                  "status": "UNDEFINED",
                  "type": "TELEFONO",
                  "value": "934111700"
                },
                {
                  "id": "12d76f1c-64c7-453b-a760-afbf88d45791",
                  "note": null,
                  "status": "GOOD",
                  "type": "TELEFONO",
                  "value": "622386851"
                }
              ]
            },
            "status": "NO_VERIFICADO",
            "type": "PRINCIPAL"
          },
          {
            "featuredContact": null,
            "id": "7aad6771-c989-4efb-a01a-dba39c254071",
            "name": "paul capriotti",
            "person": {
              "contacts": [
                {
                  "id": "phone-reported-from-callcenter",
                  "note": "Creado desde callcenter",
                  "status": "GOOD",
                  "type": "TELEFONO",
                  "value": "622060090"
                }
              ]
            },
            "status": "VERIFICADO",
            "type": "NINGUNO"
          },
          {
            "featuredContact": {
              "emailId": null,
              "phoneId": "phone-reported-from-callcenter"
            },
            "id": "40d608b5-d1a1-481a-aa49-99efeff40e4d",
            "name": "paul capriotti",
            "person": {
              "contacts": [
                {
                  "id": "phone-reported-from-callcenter",
                  "note": "Creado desde callcenter",
                  "status": "GOOD",
                  "type": "TELEFONO",
                  "value": "622090060"
                },
                {
                  "id": "23deb017-350c-4240-a1fd-a1e2b18e9f13",
                  "note": null,
                  "status": "GOOD",
                  "type": "EMAIL",
                  "value": "paul.capriotti@hotmail.com"
                }
              ]
            },
            "status": "VERIFICADO",
            "type": "NINGUNO"
          }
        ],
        "status": "TAKEN" as "TAKEN"
      }
      expect(contactsOrderStrategy(ws as any)).to.be.eql([])
    })

    it('does not give duplicated numbers across different owners', () => {
      const testWorksheet = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            id: 'test-owner-1',
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
          relatedOwnerBuilder({
            id: 'test-owner-2',
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
        ],
      }).build()
      const contacts = contactsOrderStrategy(testWorksheet)

      expect(contacts).to.be.eql([ {
        ownerId: 'test-owner-1',
        id: 'test-first-contact-id',
        status: 'UNDEFINED',
        type: 'TELEFONO',
        value: '666666666',
      } ])
    })

    it('returns contacts in same order', () => {
      const testWorksheet = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            id: 'test-owner-id',
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666667',
                },
              ]
            }
          })(),
        ],
      }).build()
      const testReverseOrderWorksheet = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            id: 'test-owner-id',
            person: {
              contacts: [
                {
                  id: 'test-second-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666667',
                },
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
        ]
      }).build()

      const contactsInOrder = contactsOrderStrategy(testWorksheet)
      const contactsInReverseOrder = contactsOrderStrategy(testReverseOrderWorksheet)

      expect(contactsInOrder).to.be.eql(contactsInReverseOrder)
    })

    it('removes duplicated BAD contacts', () => {
      const testWorksheet = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'BAD',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
        ],
      }).build()

      const contacts = contactsOrderStrategy(testWorksheet)

      expect(contacts).to.be.eql([])
    })

    it('publishes event on duplicated contacts in owner', () => {
      const testWorksheet = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            id: 'test-owner-id',
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'BAD',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
        ],
      }).build()

      contactsOrderStrategy(testWorksheet)

      expect(eventBusStub.publish).to.have.been.calledWith({
        name: 'virtual_caller.duplicated_contact_detected_in_owner',
        ownerId: 'test-owner-id',
      })
    })

    it('starts with validated contacts', () => {
      const testWorksheet = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            person: {
              contacts: [
                {
                  id: 'test-undefined-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-good-contact-id',
                  status: 'GOOD',
                  type: 'TELEFONO',
                  value: '666666667',
                },
              ]
            }
          })(),
        ],
      }).build()

      const orderedContacts = contactsOrderStrategy(testWorksheet)

      expect(orderedContacts[ 0 ].id).to.be.equal('test-good-contact-id')
    })

    it('starts with featured owner', () => {
      const worksheetView = worksheetViewBuilder({
        relatedOwners: [
          relatedOwnerBuilder({
            id: 'test-non-featured-owner-id',
            person: {
              contacts: [
                {
                  id: 'test-non-featured-contact-id',
                  status: 'GOOD',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
          relatedOwnerBuilder({
            id: 'test-featured-owner-id',
            person: {
              contacts: [
                {
                  id: 'test-featured-owner-contact-id',
                  status: 'GOOD',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          })(),
        ],
      }).build()
      const testWorksheet = CallcenterView.update(worksheetView, {
        building: {
          $set: WorksheetBuilding.update(worksheetView.building, {
            featuredOwnerId: {
              $set: 'test-featured-owner-id'
            }
          })
        }
      })

      const orderedContacts = contactsOrderStrategy(testWorksheet)

      expect(orderedContacts[ 0 ].id).to.be.equal('test-featured-owner-contact-id')
    })
  })
})
