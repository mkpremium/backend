import assert from 'assert';
import {createBuildingWithWorksheet} from '../../../src/worksheet/building/model';
import {WorkSheetStatus} from '../../../src/types/worksheet';
import {deleteAll} from '../../common';
import {WorksheetBuildingHelper} from '../../helpers/worksheet-building';
import {OperatorHelper} from '../../helpers/operator';
import {catchError} from '../../helpers/util';

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
  };

  const payloadWithPlaceId = Object.assign({}, payload, {
    placeId: 'aaaabbbcccc00045'
  });
  const payloadWithCadastre = Object.assign({}, payload, {
    cadastre: {
      reference: 'aaaabbbbbbcccc',
      address: 'TV 44 # 100 - 82'
    }
  });

  function asserts(worksheet) {
    worksheet.should.be.an('object');
    worksheet.id.should.not.equal(null);
    worksheet.status.should.equal(WorkSheetStatus.INVALID);
  }

  describe('createBuildingWithWorksheet', () => {
    beforeEach(async() => deleteAll());

    it('create building with worksheet by placeId', async() => {
      const worksheet = await createBuildingWithWorksheet(payloadWithPlaceId);
      asserts(worksheet);
    });

    it('create building with worksheet by cadastre reference', async() => {
      const worksheet = await createBuildingWithWorksheet(payloadWithCadastre);
      asserts(worksheet);
    });

    it('doesnt allow create building with duplicate placeId', async() => {
      await createBuildingWithWorksheet(payloadWithPlaceId);

      const {error} = await catchError(createBuildingWithWorksheet(payloadWithPlaceId));

      if (!error) {
        assert.fail('Should not allow save duplicate');
      }
    });

    it('doesnt allow create building with duplicate cadastre reference', async() => {
      await createBuildingWithWorksheet(payloadWithCadastre);

      const {error} = await catchError(createBuildingWithWorksheet(payloadWithCadastre));

      if (!error) {
        assert.fail('Should not allow save duplicate');
      }
    });
  });

  describe('POST /worksheets/buildings', () => {
    beforeEach(async() => deleteAll());

    it('create building with worksheet by placeId (API)', async() => {
      const authenticatedOperator = await OperatorHelper.createAndLogin();
      const worksheet = await WorksheetBuildingHelper
        .createBuildingWithWorksheetViaApi(authenticatedOperator, payloadWithPlaceId);

      asserts(worksheet);
    });

    it('create building with worksheet by cadastre reference (API)', async() => {
      const authenticatedOperator = await OperatorHelper.createAndLogin();
      const worksheet = await WorksheetBuildingHelper
        .createBuildingWithWorksheetViaApi(authenticatedOperator, payloadWithCadastre);
      asserts(worksheet);
    });
  });
});
