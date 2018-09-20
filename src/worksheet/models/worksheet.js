import Promise from 'bluebird';
import {N1qlQuery} from 'couchbase';
import t from 'tcomb';
import debug from 'debug';
import _get from 'lodash/get';
import _head from 'lodash/head';
import _some from 'lodash/some';
import _every from 'lodash/every';
import _find from 'lodash/find';
import _isNil from 'lodash/isNil';
import fromJSON from 'tcomb/lib/fromJSON';

import {CouchbaseModel} from '../../db/model';
import {
  addDateQueryToBuilder,
  addBetweenQueryToBuilder
} from '../../lib/query/helpers';
import {newHttpError} from '../../lib/http-error';
import {OwnerRepository} from '../../owner/models';
import {BuildingRepository} from '../../building/models';
import _uniq from 'lodash/uniq';
import {ownersContactViews} from '../../owner/types';
import {NotFinalWorksheetStats, WorkSheetStatus} from '../../types/worksheet';
import {
  isAllowedChangeState,
  isInvalidVerified,
  ownerNoSale,
  ownerAlreadySold,
  ownerVerified, publicEntity
} from '../../types/owner';
import {ScheduledEvents} from '../../scheduled-events/models';
import {OperatorActions} from '../../stats/types';
import {OperatorStats} from '../../stats/models';
import {saveStreetBuildingToFirebase} from '../../firebase/lib/street';
import {BuildingState} from '../../types/enums';

const statuses = `[${NotFinalWorksheetStats.map(id => `'${id}'`).join(', ')}]`;

const worksheetDebug = debug('app:model:worksheet');

function canRegisterVerified(worksheet, newStatus, operatorId) {
  if (!operatorId) {
    return false;
  }

  if (worksheet.status === newStatus) {
    return false;
  }

  if (newStatus !== WorkSheetStatus.WITH_OWNER) {
    return false;
  }

  return true;
}

export class Worksheet extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorkSheet;
  }
}

const WorksheetStatsParams = t.struct({
  city: t.maybe(t.String)
});

export class WorksheetRepository extends Worksheet {
  async countWorksheetsInSource(source) {
    const bucket = this.getBucketName();
    const sourceFilter = [];
    Object.keys(source).forEach(key => {
      const value = source[key];
      if (!_isNil(value)) {
        sourceFilter.push(`t2.address.${key} = '${value}'`);
      }
    });
    const filter = sourceFilter.length > 0
      ? 'AND ' + sourceFilter.join(' AND ')
      : '';

    const baseQuery = `SELECT COUNT(*) as count FROM ${bucket} t
    LET _building = (SELECT RAW t2.id FROM ${bucket} t2 WHERE (t2._documentType = 'building' ${filter}))
    WHERE (t._documentType = 'worksheet') AND (queueId IS NULL) AND (status IN ${statuses}) AND (t.relatedBuildingIds[0] IN _building)`;
    const results = await this.queryRaw(N1qlQuery.fromString(baseQuery));
    return _get(results, '0.count', 0);
  }

  async worksheetStats(args = {}) {
    const params = WorksheetStatsParams(args);
    const bucket = this.getBucketName();
    const query = _isNil(params.city)
      ? `SELECT t.status, COUNT(*) as count FROM ${bucket} t
WHERE t._documentType = 'worksheet AND t.status IS NOT MISSING'
GROUP BY t.status`
      : `SELECT t.status, COUNT(*) as count FROM ${bucket} t
LET building = (SELECT RAW p FROM ${bucket} p USE KEYS t.relatedBuildingIds[0] WHERE p.id = t.relatedBuildingIds[0] LIMIT 1)
WHERE t._documentType = 'worksheet AND t.status IS NOT MISSING'
AND LOWER(building[0].address.city) = LOWER('${params.city}')
GROUP BY t.status`;

    const result = await this.queryRaw(N1qlQuery.fromString(query));
    const totals = {};

    Object.values(WorkSheetStatus).forEach(status => {
      const total = _find(result, {status}) || {count: 0};
      totals[status] = total.count;
    });

    return totals;
  }

  async _findBySourceAndReference(source, worksheetIndex) {

    const buildingRepo = new BuildingRepository();
    const qb = this.getQueryBuilder('let')
      .where('queueId IS NULL')
      .where(`status IN ${statuses}`)
      .order('t.worksheetIndex')
      .limit(1);

    const letBuilding = buildingRepo.getQueryBuilder('raw', 't2')
      .order('t2.id');

    Object.keys(source).forEach(key => {
      const value = source[key];
      if (!_isNil(value)) {
        letBuilding.where(`t2.address.${key} = ?`, value);
      }
    });

    qb
      .letQuery('_building', letBuilding)
      .where('t.`relatedBuildingIds`[0] IN _building');

    if (worksheetIndex) {
      qb.where('t.worksheetIndex > ?', worksheetIndex);
    }

    return this.query(qb);
  }

  async findBySource({source, worksheetIndex}) {
    const withReferenceResults = await this._findBySourceAndReference(source, worksheetIndex);
    if (!withReferenceResults || withReferenceResults.length === 0) {
      return this._findBySourceAndReference(source);
    }
    return withReferenceResults;
  }

  async findByIdOrThrow(worksheetId) {
    const worksheet = await this.findById(worksheetId);
    if (!worksheet) {
      throw newHttpError(404, `La hoja de trabajo ${worksheetId} no existe`);
    }

    return worksheet;
  }

  async findByIdWIthIncludes(id, includes = ['relatedOwners', 'relatedBuildings']) {
    let worksheet = await this.findByIdOrThrow(id);
    if (includes.indexOf('relatedBuildings') !== -1 && worksheet.relatedBuildingIds.length > 0) {
      const buildingRepo = new BuildingRepository();
      const idsText = `[${worksheet.relatedBuildingIds.map(id => `'${id}'`).join(', ')}]`;
      const rbQb = await buildingRepo.getQueryBuilder().where(`id IN ${idsText}`);
      const relatedBuildings = await buildingRepo.query(rbQb);
      worksheet = t.update(worksheet, {relatedBuildings: {$set: relatedBuildings}});
    }

    if (includes.indexOf('relatedOwners') !== -1 && worksheet.relatedOwnerIds.length > 0) {
      const ownerRepo = new OwnerRepository();
      const relatedOwners = await ownerRepo.findByIdWithIncludes(worksheet.relatedOwnerIds);
      worksheet = t.update(worksheet, {
        relatedOwners: {$set: relatedOwners},
        ownerContacts: {$set: ownersContactViews(relatedOwners)}
      });
    }

    return worksheet;
  }

  // noinspection JSMethodCanBeStatic
  async findMeetings(worksheetId) {
    const meetingRepo = new ScheduledEvents();
    const qb = meetingRepo.getQueryBuilder();
    qb.where('event.worksheetId = ?', worksheetId);
    return meetingRepo.query(qb);
  }

  async calculateNewStatus(worksheet) {
    worksheetDebug('calculateNewStatus', worksheet.id, 'with status', worksheet.status);
    const isValidLength = worksheet.relatedOwners.length > 0;
    const someValidOwner = isValidLength && _some(worksheet.relatedOwners, ownerVerified);
    const isPublicEntity = isValidLength && _some(worksheet.relatedOwners, publicEntity);
    const everyInvalidOwner = isValidLength && _every(worksheet.relatedOwners, isInvalidVerified);
    const noSale = isValidLength && _some(worksheet.relatedOwners, ownerNoSale);
    const alreadySold = isValidLength && _some(worksheet.relatedOwners, ownerAlreadySold);
    const meetings = await this.findMeetings(worksheet.id);
    const hasMeeting = meetings.length > 0;

    switch (worksheet.status) {
      case WorkSheetStatus.DEFAULT:
        if (isPublicEntity) {
          return WorkSheetStatus.PUBLIC;
        }

        if (hasMeeting) {
          return WorkSheetStatus.MEETING;
        }

        if (noSale) {
          return WorkSheetStatus.NO_SALE;
        }

        if (alreadySold) {
          return WorkSheetStatus.ALREADY_SOLD;
        }

        if (someValidOwner) {
          return WorkSheetStatus.WITH_OWNER;
        }

        if (everyInvalidOwner) {
          return WorkSheetStatus.INVALID;
        }

        return worksheet.status;
      case WorkSheetStatus.WITH_OWNER:
        if (noSale) {
          return WorkSheetStatus.NO_SALE;
        }
        if (alreadySold) {
          return WorkSheetStatus.ALREADY_SOLD;
        }

        if (hasMeeting) {
          return WorkSheetStatus.MEETING;
        }
        return worksheet.status;
      default:
        worksheetDebug(`the status ${worksheet.status} don't have planned behavior`);
        return worksheet.status;
    }
  }

  static async canUpdateOwner(owner, updatedOwner) {
    const worksheetRepo = new WorksheetRepository();
    const worksheet = await worksheetRepo.findWorksheetByOwner(owner.id);
    if (worksheet && worksheet.status === WorkSheetStatus.WITH_OWNER && owner.isPrimaryVerified()) {
      if (!isAllowedChangeState(updatedOwner)) {
        throw newHttpError(
          422,
          `No se puede actualizar el owner. Es "${owner.type}" y fue verificado (${owner.confirmedByOperator})`
        );
      }
    }

    return true;
  }

  async updateStatus(worksheetId, operatorId) {
    const worksheetData = await this.findByIdWIthIncludes(worksheetId);
    const worksheet = fromJSON(worksheetData, t.WorkSheet);
    const newStatus = await this.calculateNewStatus(worksheet);
    const updatedWorksheet = worksheet.setStatus(newStatus);
    if (canRegisterVerified(worksheet, newStatus, operatorId)) {
      await OperatorStats.registerAction(operatorId, OperatorActions.VERIFIED_OWNER);
    }

    const savedWorksheet = await this.save(updatedWorksheet);
    await this.shouldMarkBuildingAndRequestMoreInfo(savedWorksheet);

    return savedWorksheet;
  }

  async shouldMarkBuildingAndRequestMoreInfo(worksheet) {
    const shouldContinue = worksheet.status === WorkSheetStatus.INVALID;
    worksheetDebug('shouldMarkBuildingAndRequestMoreInfo', worksheet.id, shouldContinue);
    if (!shouldContinue) {
      return;
    }

    const buildingRepo = new BuildingRepository();

    const wo = await this.findByIdWIthIncludes(worksheet.id);
    return Promise.map(wo.relatedBuildings, (building) => {
      const owner = _find(wo.relatedOwners, {buildingId: building.id});
      return Promise.all([
        saveStreetBuildingToFirebase(building, owner),
        buildingRepo.update(building, {state: BuildingState.MALO})
      ]);
    });
  }

  async sendWorksheetEvent(worksheetId) {
    const worksheet = await this.findById(worksheetId);
    if (worksheet) {
      return this.sendEvent(`${worksheet.id}`, worksheet);
    }
  }

  static async notifyWorkSheetChange(worksheetId) {
    const worksheetRepo = new WorksheetRepository();
    await worksheetRepo.sendWorksheetEvent(worksheetId);
  }

  static async updateWorkSheetStatus(worksheetId, operatorId) {
    const worksheetRepo = new WorksheetRepository();
    return worksheetRepo.updateStatus(worksheetId, operatorId);
  }

  static async notifyWorkSheetChangeByOwner(ownerId) {
    const worksheetRepo = new WorksheetRepository();
    const worksheet = await worksheetRepo.findWorksheetByOwner(ownerId);
    if (worksheet) {
      await WorksheetRepository.notifyWorkSheetChange(worksheet.id);
    }
  }

  async findWorksheetByBuilding(buildingId) {
    const qb = this.getQueryBuilder()
      .where('ANY v IN t.`relatedBuildingIds` SATISFIES v = ? END', buildingId);

    const results = await this.query(qb);

    return _head(results);
  }

  async findWorksheetByOwner(ownerId) {
    const qb = this.getQueryBuilder()
      .where('ANY v IN t.`relatedOwnerIds` SATISFIES v = ? END', ownerId);

    const results = await this.query(qb);

    return _head(results);
  }

  async addOwner(worksheet, owner) {
    const updatedWorksheet = t.update(worksheet, {
      relatedBuildingIds: {
        $set: _uniq(worksheet.relatedBuildingIds.concat([owner.buildingId]))
      },
      relatedOwnerIds: {
        $set: _uniq(worksheet.relatedOwnerIds.concat([owner.id]))
      }
    });

    return this.save(updatedWorksheet);
  }

  async preSave(data) {
    const worksheetIndex = data.worksheetIndex || await this._getNewIndex();
    // never store this
    return t.update(data, {
      $merge: {
        worksheetIndex
      },
      ownerContacts: {$set: []},
      relatedBuildings: {$set: []},
      relatedOwners: {$set: []}
    });
  }

  async _getNewIndex() {
    const counter = this.getCounter();
    return counter.count(this.getType(), 1);
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
      addDateQueryToBuilder(qb, 'viewedAt', params.viewedAt);
      addDateQueryToBuilder(qbCount, 'viewedAt', params.viewedAt);
    } else {
      addBetweenQueryToBuilder(qb, 'viewedAt', params.viewedBetween);
      addBetweenQueryToBuilder(qbCount, 'viewedAt', params.viewedBetween);
    }

    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.WorkSheetLitResponse);
  }
}
