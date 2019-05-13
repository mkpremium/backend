import _ from 'lodash';
import Promise from 'bluebird';
import {deleteAll} from '../test/common';
import {createBuildingWithWorksheet} from '../src/worksheet/building/model';
import {queryBuildingByCity, setBuildingsPlaceIdByCity} from './cli-building-set-place-id';

describe('setBuildingsPlaceIdByCity', () => {
  const baseBuilding = {
    location: {
      lat: 40.412253,
      lng: -3.705473
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

  const buildings = _.times(3, function(i) {
    const reference = `aaaabbbcccc00045${i}`;
    return Object.assign({}, baseBuilding, {
      cadastre: {
        reference,
        address: 'TV 44 # 100 - 82'
      }
    });
  });

  before(async() => {
    await deleteAll();
    await Promise.map(buildings, createBuildingWithWorksheet);
  });

  it('able to set placeId on building without', async() => {
    const city = 'Barranquilla';
    const before = await queryBuildingByCity(city);
    before.should.have.length(3);

    await setBuildingsPlaceIdByCity(city);

    const after = await queryBuildingByCity(city);
    after.should.have.length(0);
  });
});
