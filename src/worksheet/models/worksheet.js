import Promise from 'bluebird';
import uuid from 'uuid/v4';
import {N1qlQuery} from 'couchbase';
import t from 'tcomb';
import debug from 'debug';
import _ from 'lodash';
import _get from 'lodash/get';
import _head from 'lodash/head';
import _some from 'lodash/some';
import _every from 'lodash/every';
import _find from 'lodash/find';
import _isNil from 'lodash/isNil';
import fromJSON from 'tcomb/lib/fromJSON';

import {CouchbaseModel} from '../../db/model';
import {addBetweenQueryToBuilder, addDateQueryToBuilder} from '../../lib/query/helpers';
import {newHttpError} from '../../lib/http-error';
import {OwnerRepository} from '../../owner/models';
import {BuildingRepository} from '../../building/models';
import _uniq from 'lodash/uniq';
import {ownersContactViews} from '../../owner/types';
import {Worksheet, WorkSheetStatus} from '../../types/worksheet';
import {
  haveOwnerBusiness,
  isInvalid,
  ownerAlreadySold,
  ownerNoSale,
  ownerVerified,
  publicEntity
} from '../../types/owner';
import {ScheduledEvents, ScheduledEventsRepository} from '../../scheduled-events/models';
import {OperatorActions} from '../../stats/types';
import {OperatorStats} from '../../stats/models';
import {saveStreetBuildingToFirebase} from '../../firebase/lib/street';
import {BuildingState, OwnerBusinessStatus} from '../../types/enums';
import {WorksheetListQuery, WorksheetSearchQuery, WorksheetSearchResponse} from '../types';
import _map from 'lodash/map';
import {emitModelEvents} from '../../../config';
import {ScheduledEventType} from '../../scheduled-events/types';

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

export class WorksheetRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorkSheet;
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
        ownerContacts: {$set: ownersContactViews(relatedOwners, worksheet)}
      });
    }

    return worksheet;
  }

  async findMeetings(worksheetId) {
    const meetingRepo = new ScheduledEvents();
    const qb = meetingRepo.getQueryBuilder();
    qb.where('type = ?', ScheduledEventType.MEETINGS);
    qb.where('event.worksheetId = ?', worksheetId);
    return meetingRepo.query(qb);
  }

  static async findMeetings(worksheetId) {
    const repo = new WorksheetRepository();
    return repo.findMeetings(worksheetId);
  }

  async findWorksheetByBuilding(buildingId) {
    const qb = this.getQueryBuilder()
      .where('ANY v IN t.`relatedBuildingIds` SATISFIES v = ? END', buildingId);

    const results = await this.query(qb);

    return fromJSON(_head(results), t.WorkSheet);
  }

  static async findByBuilding(buildingId) {
    const repo = new WorksheetRepository();
    return repo.findWorksheetByBuilding(buildingId);
  }

  async findWorksheetByOwner(ownerId) {
    const qb = this.getQueryBuilder()
      .where('ANY v IN t.`relatedOwnerIds` SATISFIES v = ? END', ownerId);

    const results = await this.query(qb);

    return _head(results);
  }

  calculateBusinessStatus(owner) {
    switch (owner.business.status) {
      case OwnerBusinessStatus.DISCARDED:
        worksheetDebug('Owner business status is discarded so status is _PUBLIC');
        return WorkSheetStatus.PUBLIC;
      case OwnerBusinessStatus.NO_SALE:
        worksheetDebug('Owner business status is NO_SALE so status is _NO_SALE');
        return WorkSheetStatus.NO_SALE;
      case OwnerBusinessStatus.ALREADY_SOLD:
        worksheetDebug('Owner business status is ALREADY_SOLD so status is _INVALID');
        return WorkSheetStatus.INVALID;
      default:
        worksheetDebug('Owner business status is defult so status is _MEETING');
        return WorkSheetStatus.MEETING;
    }
  }

  async calculateFixedStatus(worksheet) {
    worksheetDebug('calculateFixedStatus', worksheet.id, 'with status', worksheet.status);
    worksheetDebug('calculateNewStatus', worksheet.id, 'with status', worksheet.status);
    const isValidLength = worksheet.relatedOwners.length > 0;
    const owners = isValidLength
      ? await Promise.map(worksheet.relatedOwners, OwnerRepository.validateOwner)
      : [];

    const haveBusiness = isValidLength && haveOwnerBusiness(owners);
    const someValidOwner = isValidLength && _some(owners, ownerVerified);
    const isPublicEntity = isValidLength && _some(owners, publicEntity);
    const everyInvalidOwner = isValidLength && _every(owners, isInvalid);
    const noSale = isValidLength && _some(owners, ownerNoSale);
    const alreadySold = isValidLength && _some(owners, ownerAlreadySold);
    const meetings = await this.findMeetings(worksheet.id);
    const hasMeeting = meetings.length > 0;
    worksheetDebug('Begin to calculate worksheet status');
    if (haveBusiness) {
      worksheetDebug('Begin to calculate worksheet status');
      return this.calculateBusinessStatus(haveBusiness);
    }

    if (isPublicEntity) {
      worksheetDebug('Worksheet new status is _PUBLIC');
      return WorkSheetStatus.PUBLIC;
    }

    if (noSale) {
      worksheetDebug('Worksheet new status is _NO_SALE');
      return WorkSheetStatus.NO_SALE;
    }

    if (alreadySold) {
      worksheetDebug('Worksheet new status is _ALREADY_SOLD');
      return WorkSheetStatus.ALREADY_SOLD;
    }

    if (everyInvalidOwner) {
      worksheetDebug('Worksheet new status is _INVALID');
      return WorkSheetStatus.INVALID;
    }

    if (hasMeeting) {
      worksheetDebug('Worksheet new status is _MEETING');
      return WorkSheetStatus.MEETING;
    }

    if (someValidOwner) {
      worksheetDebug('Worksheet new status is _WITH_OWNER');
      return WorkSheetStatus.WITH_OWNER;
    }
    worksheetDebug(`Worksheet new status is same status ${worksheet.status}`);
    return worksheet.status;
  }

  async updateStatus(worksheetId, operatorId) {
    const worksheetData = await this.findByIdWIthIncludes(worksheetId);
    const worksheet = fromJSON(worksheetData, t.WorkSheet);
    // const newStatus = await this.calculateNewStatus(worksheet);
    const newStatus = await this.calculateFixedStatus(worksheet);
    const updatedWorksheet = worksheet.setStatus(newStatus);
    if (canRegisterVerified(worksheet, newStatus, operatorId)) {
      await OperatorStats.registerAction(operatorId, OperatorActions.VERIFIED_OWNER);
    }

    const savedWorksheet = await this.save(updatedWorksheet);
    // await this.shouldMarkBuildingAndRequestMoreInfo(savedWorksheet);

    return savedWorksheet;
  }

  // noinspection JSUnusedGlobalSymbols
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

  async worksheetStats() {
    const bucket = this.getBucketName();

    const query = `SELECT t.buildingAddress.province, t.status, COUNT(*) as count FROM ${bucket} t
    WHERE t._documentType = 'worksheet' AND t.status IS NOT MISSING
    GROUP BY t.status, t.buildingAddress.province`;

    const result = await this.queryRaw(N1qlQuery.fromString(query));

    const provinces = _.uniq(result.map(r => r.province));

    const totals = {};

    provinces.forEach(province => {
      totals[province] = {};
      Object.values(WorkSheetStatus).forEach(status => {
        const total = _find(result, {province: province, status: status}) || {count: 0};
        totals[province][status] = total.count;
      });
    });

    return totals;
  }

  async countWorksheetsInSource(source) {
    const bucket = this.getBucketName();
    const sourceFilter = [];
    Object.keys(source).forEach(key => {
      const value = source[key];
      if (!_isNil(value)) {
        sourceFilter.push(`t.buildingAddress.${key} IS NOT MISSING`);
        sourceFilter.push(`t.buildingAddress.${key} = ${JSON.stringify(value)}`);
      }
    });
    const filter = sourceFilter.length > 0
      ? 'AND ' + sourceFilter.join(' AND ')
      : '';

    const baseQuery = `SELECT COUNT(*) as count FROM ${bucket} t
    WHERE (t._documentType = 'worksheet') AND (queueId IS NULL) AND (status = 'OPEN' OR status = 'LOOKING_MEETING') ${filter}`;
    const results = await this.queryRaw(N1qlQuery.fromString(baseQuery));
    return _get(results, '0.count', 0);
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

  static async createNewForBuilding(building) {
    const worksheet = Worksheet({
      id: uuid(),
      _relatedTo: _get(building, 'owner.name'),
      relatedBuildingIds: [building.id],
      relatedOwnerIds: [],
      buildingAddress: building.address,
      status: WorkSheetStatus.INVALID,
      queueId: null
    });
    const repo = new WorksheetRepository();

    return repo.save(worksheet, emitModelEvents);
  }

  async syncWorksheetFirebase(worksheet) {
    const worksheetMeetings = await WorksheetRepository.findMeetings(worksheet.id);
    const buildingMeetings = await BuildingRepository.findMeetings(worksheet.relatedBuildingIds[0]);
    const allMeetingIds = (worksheetMeetings || []).concat(buildingMeetings || []).map(({id}) => id);
    const meetings = _.chain(allMeetingIds).compact().uniq().value();
    if (meetings.length > 0) {
      return Promise.mapSeries(meetings, id => ScheduledEventsRepository.firebaseMeetingById(id));
    }
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

  async _findBySourceAndReference(source, worksheetIndex) {
    const qb = this.getQueryBuilder()
      .where('queueId IS NULL')
      .where(`status = 'OPEN' OR status = 'LOOKING_MEETING'`)
      .order('t.worksheetIndex')
      .limit(1);

    Object.keys(source).forEach(key => {
      const value = source[key];
      if (!_isNil(value)) {
        qb.where(`t.buildingAddress.${key} IS NOT MISSING`);
        qb.where(`t.buildingAddress.${key} = ?`, value);
      }
    });

    if (worksheetIndex) {
      qb.where('t.worksheetIndex IS NOT MISSING');
      qb.where('t.worksheetIndex > ?', worksheetIndex);
    }

    try {
      const promise = Promise.resolve(this.query(qb));
      const result = await promise.timeout(3000);
      return result;
    } catch (e) {
      if (e instanceof Promise.TimeoutError) {
        return Promise.resolve(this.query(qb)).timeout(3000);
      } else {
        throw e;
      }
    }
  }

  async _getNewIndex() {
    const counter = this.getCounter();
    return counter.count(this.getType(), 1);
  }

  /**
   * Attaches related building objects to a worksheet
   * @param worksheet
   * @returns {Promise<*>}
   */
  async worksheetWithRelatedBuildings(worksheet) {
    let updatedWorksheet = worksheet;
    if (worksheet.relatedBuildingIds.length > 0) {
      const buildingRepo = new BuildingRepository();
      const idsText = `[${worksheet.relatedBuildingIds.map(id => `'${id}'`).join(', ')}]`;
      const rbQb = await buildingRepo.getQueryBuilder().where(`id IN ${idsText}`);
      const relatedBuildings = await buildingRepo.query(rbQb);
      updatedWorksheet = t.update(worksheet, {relatedBuildings: {$set: relatedBuildings}});
    }

    return updatedWorksheet;
  }

  async list(query = {}) {
    const params = new WorksheetListQuery(query);
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

    if (params.ownerName) {
      qb.where('_relatedTo = ?', params.ownerName);
      qbCount.where('_relatedTo = ?', params.ownerName);
    }

    const total = await this.countQuery(qbCount);
    let results = await this.query(qb);

    results = await Promise.map(results, (worksheet) => this.worksheetWithRelatedBuildings(worksheet));

    return fromJSON({total, results}, t.WorkSheetLitResponse);
  }

  /**
   * Find all worksheets with a particular queue id.
   * @param queueId
   * @returns {Promise<Array<Worksheet>>}
   */
  async findWorksheetsByQueueId(queueId) {
    const qb = this
      .getQueryBuilder()
      .where('queueId = ?', queueId);

    return this.query(qb);
  }

  /**
   * Sets to null the queue id of an array of worksheets ids.
   * @returns {Promise<void>}
   */
  async updateQueueId(worksheetIds) {
    const bucket = this.getBucketName();
    const cleanQueueIds = N1qlQuery
      .fromString(`UPDATE ${bucket} t SET queueId = null WHERE META().id IN ${JSON.stringify(worksheetIds)}`);

    return this.queryRaw(cleanQueueIds);
  }

  /**
   * Searches worksheets using full text search tool from current database.
   * @param {Object} query
   * @property query.keyword - the word to be searched
   * @property query.limit - the limit of the results, default : 20
   * @returns {Promise<WorksheetSearchResponse>}
   */
  async searchWorksheets(query) {
    let results = [];
    const params = new WorksheetSearchQuery(query);
    const qs = this.getSearchBuilder(params.query);
    qs.limit(Number(params.limit));

    const searchResult = await this.search(qs);
    const worksheetIds = _map(searchResult, 'id');

    if (worksheetIds.length) {
      results = await Promise.map(worksheetIds, (worksheetId) => this.findByIdWIthIncludes(worksheetId));
    }
    return fromJSON({results}, WorksheetSearchResponse);
  }

  /**
   * Attaches related owners objects to a worksheet
   * @param worksheet
   * @returns {Promise<*>}
   */
  static async worksheetWithRelatedOwners(worksheet) {
    let updatedWorksheet = worksheet;

    if (worksheet.relatedOwnerIds.length > 0) {
      const ownerRepository = new OwnerRepository();
      const relatedOwners = await ownerRepository.findByIdWithIncludes(worksheet.relatedOwnerIds);
      updatedWorksheet = t.update(worksheet, {
        relatedOwners: {$set: relatedOwners},
        ownerContacts: {$set: ownersContactViews(relatedOwners, worksheet)}
      });
    }

    return updatedWorksheet;
  }

  /**
   * Finds all worksheets with the owners.
   * @returns {Promise<*>}
   */
  async findAllWorksheetsWithOwners(limit, offset) {
    const qb = this.getQueryBuilder()
      .limit(limit || 10)
      .offset(offset || 0)
      .order('worksheetIndex');
    const results = await this.query(qb);

    return Promise.map(results, (worksheet) => WorksheetRepository.worksheetWithRelatedOwners(worksheet));
  }

  /**
   * Find all worksheets with a particular status.
   * @param status
   * @returns {Promise<Array<Worksheet>>}
   */
  async findWorksheetsByStatus(status) {
    const qb = this
      .getQueryBuilder()
      .where('status = ?', status);

    return this.query(qb);
  }

  /**
   * Adds an owner to a worksheet
   * @param worksheet
   * @param owner
   * @returns {Promise<*>}
   */
  async addOnlyOwner(worksheet, owner) {
    const updatedWorksheet = t.update(worksheet, {
      relatedOwnerIds: {
        $set: _uniq(worksheet.relatedOwnerIds.concat([owner.id]))
      }
    });

    return this.save(updatedWorksheet);
  }
}
