import {deleteAll} from '../test/common';
import {createBuildingWithWorksheet} from '../src/worksheet/building/model';
import {formatAllBuildingAddresses, formatCityBuildingAddresses} from '../cli/cli-building-format-fulladdress';
import {BuildingRepository} from '../src/building/models';
import {WorksheetRepository} from '../src/worksheet/models/worksheet';

describe('formatByBuildingAddress', () => {
  const building = {
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
    },
    cadastre: {
      reference: 'aaaaabbbbcvccc',
      address: 'TV 44 # 100 - 82'
    }
  };
  const building2 = Object.assign({}, building, {
    cadastre: {
      reference: 'aaaaabbbbcvcc1',
      address: 'TV 44 # 100 - 82'
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
      city: 'Monteria',
      province: 'Atlantico',
      zone: 'Norte',
      neighborhood: 'Miramar'
    }
  });

  before(async() => {
    await deleteAll();
    await createBuildingWithWorksheet(building);
  });

  it('able to format address for all buildings', async() => {
    await formatAllBuildingAddresses();
    const expected = 'Transversal 44 10082, Barranquilla';
    const building = await BuildingRepository.findByCadastreReference('aaaaabbbbcvccc');
    const worksheet = await WorksheetRepository.findByBuilding(building.id);
    building.address.fullAddress.should.equal(expected);
    worksheet.buildingAddress.fullAddress.should.equal(expected);
  });

  it('able to filter by city', async() => {
    await createBuildingWithWorksheet(building2);
    await formatCityBuildingAddresses('Barranquilla');
    const first = await BuildingRepository.findByCadastreReference('aaaaabbbbcvcc1');
    first.address.fullAddress.should.equal('Transversal 44 # 100 - 82');
    await formatCityBuildingAddresses('Monteria');
    const second = await BuildingRepository.findByCadastreReference('aaaaabbbbcvcc1');
    second.address.fullAddress.should.equal('Transversal 44 10082, Monteria');
  });
});
