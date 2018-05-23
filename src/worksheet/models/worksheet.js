import Promise from 'bluebird';
import t from 'tcomb';
import debug from 'debug';
import _head from 'lodash/head';
import _some from 'lodash/some';
import _every from 'lodash/every';
import _find from 'lodash/find';
import _omitBy from 'lodash/omitBy';
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
import {WorkSheetStatus} from '../../types/worksheet';
import {
  isAllowedChangeState,
  isInvalidVerified,
  ownerNoSale,
  ownerAlreadySold,
  ownerVerified
} from '../../types/owner';
import {ScheduledEvents} from '../../scheduled-events/models';
import {OperatorActions} from '../../stats/types';
import {OperatorStats} from '../../stats/models';
import {saveStreetBuildingToFirebase} from '../../firebase/lib/street';
import {BuildingState} from '../../types/enums';

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

function cleanObject(obj) {
  return _omitBy(obj, _isNil);
}

export class Worksheet extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorkSheet;
  }
}

export class WorksheetRepository extends Worksheet {
  async findBySource(source) {
    const cleanSource = cleanObject(source);
    const buildingRepo = new BuildingRepository();
    const qb = this.getQueryBuilder('let')
      .where('queueId IS NULL');

    const letBuilding = buildingRepo.getQueryBuilder('raw', 't2')
      .order('RANDOM()');

    Object.keys(cleanSource).forEach(key => {
      letBuilding.where(`t2.address.${key} = ?`, cleanSource[key]);
    });

    qb
      .letQuery('_building', letBuilding)
      .where('t.`relatedBuildingIds`[0] IN _building');

    return this.query(qb);
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
    qb.where('context.worksheetId = ?', worksheetId);
    return meetingRepo.query(qb);
  }

  async calculateNewStatus(worksheet) {
    const isValidLength = worksheet.relatedOwners.length > 0;
    const someValidOwner = isValidLength && _some(worksheet.relatedOwners, ownerVerified);
    const everyInvalidOwner = isValidLength && _every(worksheet.relatedOwners, isInvalidVerified);
    const noSale = isValidLength && _find(worksheet.relatedOwners, ownerNoSale);
    const alreadySold = isValidLength && _find(worksheet.relatedOwners, ownerAlreadySold);
    switch (worksheet.status) {
      case WorkSheetStatus.DEFAULT:
        if (someValidOwner) {
          return WorkSheetStatus.WITH_OWNER;
        }
        if (everyInvalidOwner) {
          return WorkSheetStatus.INVALID;
        }
        return WorkSheetStatus.DEFAULT;
      case WorkSheetStatus.WITH_OWNER:
        if (noSale) {
          return WorkSheetStatus.NO_SALE;
        }
        if (alreadySold) {
          return WorkSheetStatus.ALREADY_SOLD;
        }
        const meetings = await this.findMeetings(worksheet.id);
        return meetings.length > 0
          ? WorkSheetStatus.MEETING
          : WorkSheetStatus.WITH_OWNER;
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
    // never store this
    return t.update(data, {
      ownerContacts: {$set: []},
      relatedBuildings: {$set: []},
      relatedOwners: {$set: []}
    });
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
