import squel from 'squel'
import '../../../src/lib/squel/let'

describe('LET Query for Couchbase', () => {
  it('USE KEY Block', () => {
    const letQuery = squel
      .useKey()
      .useKey('t.`worksheetId`')
      .field('a.*')
      .from('mkpremium AS a')
      .where('t.`worksheetId` = a.`id`')

    const letPerson = squel
      .useKey()
      .useKey('p.`personId`')
      .field('p.*')
      .from('mkpremium AS p')
      .where('t.`worksheetId` = p.`id`')
    squel
      .let()
      .letQuery('leta', letQuery)
      .letQuery('letb', letPerson)
      .field('t.*')
      .field('leta')
      .field('letb')
      .from('mkpremium AS t')
      .where('t.id IN ?', [111]).toString()
  })
})
