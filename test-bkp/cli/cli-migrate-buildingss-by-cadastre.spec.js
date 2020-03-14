import { processByReference } from '../../cli/cli-migrate-buildings-by-cadastre'
import { deleteAll } from '../../test/common'

describe('Migrate buildings by cadastre', () => {
  before(async () => deleteAll())
  describe('processByReference', () => {
    it('be able to process a building by reference', async () => {
      await processByReference('9819908VK3791H0001SJ')
    })
  })
})
