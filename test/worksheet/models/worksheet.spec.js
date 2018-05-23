import {WorksheetRepository} from '../../../src/worksheet/models/worksheet';

describe('WorksheetRepository', () => {
  it('findBySource', async() => {
    const repo = new WorksheetRepository();
    await repo.findBySource({});
  });
});
