import assert from 'assert'
import { createBuildingWithWorksheet } from '../../../src/worksheet/building/model'
import { WorkSheetStatus } from '../../../src/types/worksheet'
import { deleteAll } from '../../../test/common'
import { WorksheetBuildingHelper } from '../../helpers/worksheet-building'
import { OperatorHelper } from '../../helpers/operator'

describe('worksheet/building/model', () => {
  const payload = {
    location: {
      lat: 0,
      lng: 0
    },
    address: {
      type: 'Transversal',
      street: '44',
      number: 10082,
      fullAddress: 'Transversal 44 # 100 - 82',
      postalCode: {
        number: 80001,
        verified: true
      },
      city: 'Barranquilla',
      province: 'Atlantico',
      zone: 'Norte',
      neighborhood: 'Miramar'
    }
  }

  const payloadWithAddress = Object.assign({}, payload)
  const payloadWithAddress2 = Object.assign({}, payload, {
    address: {
      type: 'Transversal',
      street: '44',
      number: 10082,
      fullAddress: 'Transversal 44 # 100 - 83',
      postalCode: {
        number: 80001,
        verified: true
      },
      city: 'Barranquilla',
      province: 'Atlantico',
      zone: 'Norte',
      neighborhood: 'Miramar'
    }
  })
  const payloadWithCadastre = Object.assign({}, payload, {
    cadastre: {
      reference: 'aaaabbbbbbcccc',
      address: 'TV 44 # 100 - 82'
    }
  })

  const payloadWithCadastre2 = Object.assign({}, payload, {
    cadastre: {
      reference: 'aaaabbbbbbcccc1',
      address: 'TV 44 # 100 - 82'
    }
  })

  function asserts (worksheet) {
    worksheet.should.be.an('object')
    worksheet.id.should.not.equal(null)
    worksheet.status.should.equal(WorkSheetStatus.INVALID)
  }

  describe('createBuildingWithWorksheet', () => {
    beforeEach(async () => deleteAll())

    it('create building with worksheet with only address', async () => {
      const { worksheet } = await createBuildingWithWorksheet(payloadWithAddress)
      asserts(worksheet)
    })

    it('create building with worksheet by cadastre reference', async () => {
      const { worksheet } = await createBuildingWithWorksheet(payloadWithCadastre)
      asserts(worksheet)
    })

    it('create more than one building with worksheet with only address', async () => {
      await createBuildingWithWorksheet(payloadWithAddress)
      await createBuildingWithWorksheet(payloadWithAddress2)
    })

    it('doesnt allow create building with duplicate fullAddress', async () => {
      await createBuildingWithWorksheet(payloadWithAddress)

      const { created } = await createBuildingWithWorksheet(payloadWithAddress)

      if (created) {
        assert.fail('Should not allow save duplicate')
      }
    })

    it.skip('doesnt allow create building with duplicate cadastre reference', async () => {
      await createBuildingWithWorksheet(payloadWithCadastre)

      const { created } = await createBuildingWithWorksheet(payloadWithCadastre)

      if (created) {
        assert.fail('Should not allow save duplicate')
      }
    })

    it('create more than one building with worksheet by cadastre reference', async () => {
      await createBuildingWithWorksheet(payloadWithCadastre)
      await createBuildingWithWorksheet(payloadWithCadastre2)
    })
  })

  describe('POST /worksheets/buildings', () => {
    beforeEach(async () => deleteAll())

    it('create building with worksheet by placeId (API)', async () => {
      const authenticatedOperator = await OperatorHelper.createAndLogin()
      const worksheet = await WorksheetBuildingHelper
        .createBuildingWithWorksheetViaApi(authenticatedOperator, payloadWithAddress)

      asserts(worksheet)
    })

    it('create building with worksheet by cadastre reference (API)', async () => {
      const authenticatedOperator = await OperatorHelper.createAndLogin()
      const worksheet = await WorksheetBuildingHelper
        .createBuildingWithWorksheetViaApi(authenticatedOperator, payloadWithCadastre)
      asserts(worksheet)
    })

    it.skip('should return worksheet if building cannot be created', async () => {
      const authenticatedOperator = await OperatorHelper.createAndLogin()
      const worksheet = await WorksheetBuildingHelper
        .createBuildingWithWorksheetViaApi(authenticatedOperator, payloadWithCadastre)
      asserts(worksheet)
      const response2 = await WorksheetBuildingHelper
        .createBuildingWithWorksheetViaApi(authenticatedOperator, payloadWithCadastre, 400)
      asserts(response2.worksheet)
    })
  })
})
