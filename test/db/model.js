import { CouchbaseModel } from '../../src/db/model'
import { expect } from 'chai'
import squel from 'squel'
import t from 'tcomb'

describe('getQueryBuilder', () => {
  let fixture
  beforeEach(() => {
    CouchbaseModel.prototype._promiseBucket = {}
    fixture = new ModelFixture()
  })

  it('creates count query builder', () => {
    const expectedBuilder = squel.select()
      .field('COUNT(*) as count')
      .from('mkpremium_test', 't')
      .where('t.`_documentType` = ?', 'ModelFixtureStruct')

    expect(fixture.getQueryBuilder('count').toParam())
      .to.be.deep.equal(expectedBuilder.toParam())
  })
})

const ModelFixtureStruct = t.struct(
  {
    _documentType: t.irreducible('ModelFixtureStructDocumentType', x => x === 'ModelFixtureStruct')
  }, {
    name: 'ModelFixtureStruct',
    defaultProps: {
      _documentType: 'ModelFixtureStruct'
    }
  }
)

class ModelFixture extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = ModelFixtureStruct
  }
}
