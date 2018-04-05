import t from 'tcomb';
import _head from 'lodash/head';
import _some from 'lodash/some';
import _every from 'lodash/every';
import _find from 'lodash/find';
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
import {isInvalidVerified, isPrimaryNoVende, isPrimaryVerified} from '../../types/owner';
import {ScheduledEvents} from '../../scheduledEvents/models';

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
    switch (worksheet.status) {
      case WorkSheetStatus.DEFAULT:
        const someValidOwner = _some(worksheet.relatedOwners, isPrimaryVerified);
        const everyInvalidOwner = _every(worksheet.relatedOwners, isInvalidVerified);
        if (someValidOwner) {
          return WorkSheetStatus.WITH_OWNER;
        }
        if (everyInvalidOwner) {
          return WorkSheetStatus.INVALID;
        }
        return WorkSheetStatus.DEFAULT;
      case WorkSheetStatus.WITH_OWNER:
        const noVende = _find(worksheet.relatedOwners, isPrimaryNoVende);
        if (noVende) {
          return WorkSheetStatus.NO_SALE;
        }
        const meetings = await this.findMeetings(worksheet.id);
        return meetings.length > 0
          ? WorkSheetStatus.MEETING
          : WorkSheetStatus.WITH_OWNER;
    }
  }

  async updateStatus(worksheetId) {
    const worksheet = await this.findByIdWIthIncludes(worksheetId);
    const newStatus = await this.calculateNewStatus(worksheet);
    const updatedWorksheet = worksheet.setStatus(newStatus);
    return this.save(updatedWorksheet);
  }

  async sendWorksheetEvent(worksheetId) {
    const worksheet = await this.findById(worksheetId);
    if (worksheet) {
      return this.sendEvent(`${worksheet.id}`, worksheet);
    }
  }

  static async updateWorkSheetStatusByOwner(ownerId) {
    const worksheetRepo = new WorksheetRepository();
    const worksheet = await worksheetRepo.findWorksheetByOwner(ownerId);
    if (worksheet) {
      await worksheetRepo.updateStatus(worksheet.id);
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
    return t.update(data, {ownerContacts: {$set: []}});
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
