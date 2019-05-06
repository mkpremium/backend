import app from '../../../src/app';
import {createBuildingWithWorksheet} from '../../../src/worksheet/building/model';
import {WorkSheetStatus} from '../../../src/types/worksheet';
import {defaultPassword, deleteAll, operatorCreate, operatorLogin} from '../../common';
import {WorksheetBuildingHelper} from '../../helpers/worksheet-building';

describe('Worksheet/building/model', () => {
  describe('createBuildingWithWorksheet', () => {

    const inputData = {
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
      },
      placeId: 'aaaabbbcccc00045'
    };

    beforeEach(async() => deleteAll());

    it('create building with worksheet by placeId', async() => {
      const worksheet = await createBuildingWithWorksheet(inputData);
      worksheet.should.be.an('object');
      worksheet.id.should.not.equal(null);
      worksheet.status.should.equal(WorkSheetStatus.INVALID);
    });

    it('create building with worksheet via REST', async() => {
      const operator = await operatorCreate();
      const authenticatedOperator = await operatorLogin(app, {
        username: operator.username,
        password: defaultPassword
      });
      const worksheet = await WorksheetBuildingHelper
        .createBuildingWithWorksheetViaApi(authenticatedOperator, inputData);

      worksheet.should.be.an('object');
      worksheet.id.should.not.equal(null);
      worksheet.status.should.equal(WorkSheetStatus.INVALID);
    });
  });
});
