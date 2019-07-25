import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';
import {OwnerRepository} from '../../../src/owner/models';

describe('Worksheet stats', () => {
  before(async() => {

  });

  it('Should get worksheet stats', async() => {
    const worksheetRepository = new WorksheetRepository();

    const result = await worksheetRepository.worksheetStats();

    console.log(result);
  });

  it('Should get owner stats', async() => {
    const ownerRepository = new OwnerRepository();

    const result = await ownerRepository.ownerBusinessStats();

    console.log(result);
  });

});
