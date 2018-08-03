import Promise from 'bluebird';
import squel from 'squel';
import _groupedBy from 'lodash/groupBy';
import _values from 'lodash/values';

import {MigrateModel} from './migrate-model';
import {PersonRepository} from '../../owner/models';
import {readCodigosPostalesMunicipios} from '../../../csv/codigos_postales_municipios';

export class RelatedOwnerFamilyModel extends MigrateModel {
  constructor(filename, app = {}) {
    super('related', filename, app);
  }

  async pushToDatabaseRecord(family) {

  }

  async findFamilyDuplos() {
    const repo = new PersonRepository();
    const subquery = squel
      .select().field('RAW t.firstSurname || \' \' || t.secondSurname')
      .from('mkpremium `t`')
      .group('t.firstSurname || \' \' || t.secondSurname')
      .having('COUNT(*) > 1');

    const qb = squel.select().field('p.*')
      .from('mkpremium p')
      .where('p._documentType = ?', 'person')
      .where(`p.firstSurname || ' ' || p.secondSurname IN (${subquery.toString()})`);

    return repo.query(qb);
  }

  async pushToDatabase(processedData) {
    this.codigosPostales = await readCodigosPostalesMunicipios();
    const duplos = await this.findFamilyDuplos();
    const surname = (a) => [a.firstSurname, a.secondSurname].join('');
    const families = _values(_groupedBy(duplos, surname));

    return Promise
      .map(families, this.pushToDatabaseRecord, {concurrency: 4});
  }
}
