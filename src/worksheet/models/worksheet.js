import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel} from '../../db/model';
import {utc} from '../../lib/date';
import {newHttpError} from '../../lib/http-error';
import {OwnerRepository} from '../../owner/models';
import {BuildingRepository} from '../../building/models';

export class Worksheet extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorkSheet;
  }
}

export class WorksheetRepository extends Worksheet {
  async findByIdOrThrow(worksheetId) {
    const worksheet = await this.findById(worksheetId);
    if (!worksheet) {
      throw newHttpError(404, `La hoja de trabajo ${worksheetId} no existe`);
    }

    return worksheet;
  }

  async findByIdWIthIncludes(id, includes = ['relatedOwners', 'relatedBuildings']) {
    let worksheet = await this.findByIdOrThrow(id);
    if (includes.indexOf('relatedOwners') !== -1 && worksheet.relatedOwnerIds.length > 0) {
      const ownerRepo = new OwnerRepository();
      const relatedOwners = await ownerRepo.findByIdWithIncludes(worksheet.relatedOwnerIds);
      worksheet = t.update(worksheet, {relatedOwners: {$set: relatedOwners}});
    }

    if (includes.indexOf('relatedBuildings') !== -1 && worksheet.relatedBuildingIds.length > 0) {
      const buildingRepo = new BuildingRepository();
      const idsText = `[${worksheet.relatedBuildingIds.map(id => `'${id}'`).join(', ')}]`;
      const rbQb = await buildingRepo.getQueryBuilder().where(`id IN ${idsText}`);
      const relatedBuildings = await buildingRepo.query(rbQb);
      worksheet = t.update(worksheet, {relatedBuildings: {$set: relatedBuildings}});
    }

    return worksheet;
  }

  async list(query = {}) {
    const params = new t.WorksheetListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.status) {
      qb.where('status = ?', params.status);
      qbCount.where('status = ?', params.status);
    }

    if (params.viewedAt) {
      const m = utc(params.viewedAt);
      qb.where('viewedAt >= ?', m.clone().startOf('day').toDate());
      qbCount.where('viewedAt <= ?', m.clone().endOf('day').toDate());
    } else {
      const [start, end] = params.viewedBetween.split(',').map(d => d ? utc(d) : d);
      if (start) {
        qb.where('viewedAt >= ?', start.startOf('day').toDate());
        qbCount.where('viewedAt >= ?', start.startOf('day').toDate());
      }
      if (end) {
        qb.where('viewedAt <= ?', end.endOf('day').toDate());
        qbCount.where('viewedAt <= ?', end.endOf('day').toDate());
      }
    }

    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.WorkSheetLitResponse);
  }
}
