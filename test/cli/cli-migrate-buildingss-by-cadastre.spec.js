import {processByFile, processByReference} from '../../cli/cli-migrate-buildings-by-cadastre';
import {deleteAll} from '../common';

const fileToProcess = 'fixtures/picked_data/CSV/EDIFICIOS_adicionales_mad.csv';

describe('Migrate buildings by cadastre', () => {
  before(async() => deleteAll());
  describe('processByReference', () => {
    it('be able to process a building by reference', async() => {
      await processByReference('9819908VK3791H0001SJ');
    });
  });

  describe('processByFile', () => {
    it('able to process file of buildings by references', async() => {
      await processByFile(fileToProcess);
    });
  });
});
