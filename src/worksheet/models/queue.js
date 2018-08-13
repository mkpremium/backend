import Promise from 'bluebird';
import t from 'tcomb';
import debug from 'debug';
import fromJSON from 'tcomb/lib/fromJSON';
import _map from 'lodash/map';
import _set from 'lodash/set';
import {CouchbaseModel, EmbeddedModel} from '../../db/model';
import {newHttpError} from '../../lib/http-error';
import {updateList} from '../../lib/tcomb-utils';
import {WorksheetRepository} from './worksheet';
import {utc} from '../../lib/date';
import {Queue} from '../../types/constants';

const queueDebug = debug('app:model:queue');

export class WorksheetQueue extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorksheetQueue;
  }
}

export class QueueItem extends EmbeddedModel {
  constructor() {
    super();
    this.Struct = t.QueueItem;
  }
}

export class QueueItemRepository extends QueueItem {

}

export class WorksheetQueueRepository extends WorksheetQueue {
  async findByIdOrThrow(queueId) {
    const queue = await this.findById(queueId);
    if (!queue) {
      throw newHttpError(404, `La cola ${queueId} no existe`);
    }

    return queue;
  }

  async getExtraInfo(queue) {
    const worksheetIds = _map(queue.worksheets, 'worksheetId');
    const worksheetRepo = new WorksheetRepository();
    const worksheets = await Promise
      .map(worksheetIds, (worksheetId) => worksheetRepo.findByIdWIthIncludes(worksheetId));

    return worksheets.map(worksheet => {
      const info = {};
      const item = queue.findItemByWorksheetId(worksheet.id);

      _set(info, 'totalContacts', worksheet.relatedOwners.length);
      _set(info, 'totalBuildings', worksheet.relatedBuildings.length);

      const [owner] = worksheet.relatedOwners;
      if (owner) {
        _set(info, 'ownerName', owner.person.name);
        _set(info, 'ownerType', owner.type);
      }

      const [building] = worksheet.relatedBuildings;
      if (building) {
        _set(info, 'buildingAddress', building.address.fullAddress);
      }

      const [call] = worksheet.calls;
      if (call) {
        _set(info, 'lastCall', call);
      }

      return Object.assign({}, JSON.parse(JSON.stringify(item)), info);
    });
  }

  async findWithExtra(queue) {
    const worksheets = await this.getExtraInfo(queue);
    const queueExtraInfo = Object.assign({}, JSON.parse(JSON.stringify(queue)), {worksheets});

    return fromJSON(queueExtraInfo, t.WorksheetQueueExtraInfo);
  }

  async list(query = {}) {
    const params = t.ListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const total = await this.countQuery();
    const results = await this.query(qb);
    return fromJSON({total, results}, t.QueueListResponse);
  }

  async addWorksheetAndSave(queueId, worksheetId) {
    const updatedQueue = await this.addWorksheet(queueId, worksheetId);
    return this.save(updatedQueue);
  }

  async addWorksheet(queueId, worksheetId) {
    const itemRepo = new QueueItemRepository();
    const worksheetRepo = new WorksheetRepository();
    const queue = await this.findByIdOrThrow(queueId);
    const worksheet = await worksheetRepo.findByIdOrThrow(worksheetId);

    if (worksheet.queueId) {
      throw newHttpError(409, `Worksheet ${worksheet.id} se encuentra en otra cola (${worksheet.queueId})`);
    }

    queueDebug('addWorksheet', worksheet.id, 'to queue', queue.id);

    await worksheetRepo.save(t.update(worksheet, {queueId: {$set: queue.id}}));
    const item = await itemRepo.save({worksheetId: worksheet.id});
    const updatedWorksheets = t.update(queue.worksheets, {$push: [item]});
    return t.update(queue, {
      worksheets: {$set: updatedWorksheets},
      worksheetIndex: {$set: worksheet.worksheetIndex}
    });
  }

  async removeWorksheet(queueId, worksheetId) {
    const worksheetRepo = new WorksheetRepository();
    const worksheet = await worksheetRepo.findByIdOrThrow(worksheetId);
    const queue = await this.findByIdOrThrow(queueId);
    if (worksheet.queueId !== queue.id) {
      throw newHttpError(409, `Worksheet ${worksheet.id} no se encuentra en otra cola (${worksheet.queueId})`);
    }

    const updatedWorksheet = t.update(worksheet, {$remove: ['queueId']});
    await worksheetRepo.save(updatedWorksheet);

    const updatedWorksheetItems = queue.worksheets.filter(item => item.worksheetId !== worksheet.id);
    return t.update(queue, {worksheets: {$set: updatedWorksheetItems}});
  }

  async removeWorksheetAndSave(queueId, worksheetId) {
    const updatedQueue = await this.removeWorksheet(queueId, worksheetId);
    return this.save(updatedQueue);
  }

  async scheduleWorksheetInQueue(queue, worksheetId, operatorId) {
    const item = queue.findItemByWorksheetId(worksheetId);
    if (!item) {
      throw newHttpError(400, `La Worksheet ${worksheetId} no fue encontrada en la cola`);
    }

    const worksheetRepo = new WorksheetRepository();
    const worksheet = await worksheetRepo.findById(item.worksheetId);

    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${item.worksheetId} no puede abrirse, comuníquese con su administrador`);
    }

    const updatedItem = item.schedule(operatorId);
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem);
    const updatedQueue = t.update(queue, {worksheets: {$set: updatedWorksheets}});

    queueDebug('scheduleWorksheetInQueue', worksheet.id, 'scheduled from queue ', queue.id);

    await this.save(updatedQueue);

    return updatedItem;
  }

  async takeWorksheetInQueue(queue, itemId, operatorId) {
    const item = queue.findItemById(itemId);
    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`);
    }

    if (!item.canBeOpened(operatorId)) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no esta disponible para su apertura`);
    }

    const operatorItem = queue.findItemByOperatorId(operatorId);

    if (operatorItem && operatorItem.id !== item.id) {
      throw newHttpError(409, `El operador ${operatorId} ya ha tomado un item previamente ${operatorItem.id}`);
    }

    const worksheetRepo = new WorksheetRepository();
    const worksheet = await worksheetRepo.findById(item.worksheetId);

    if (!worksheet) {
      throw newHttpError(409, `La hoja de trabajo ${item.worksheetId} no puede abrirse, comuníquese con su administrador`);
    }

    const updatedWorksheet = t.update(worksheet, {viewedAt: {$set: utc().toDate()}});
    await worksheetRepo.save(updatedWorksheet);

    const updatedItem = item.take(operatorId);
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem);
    const updatedQueue = t.update(queue, {worksheets: {$set: updatedWorksheets}});

    queueDebug('takeWorksheetInQueue', worksheet.id, 'from queue', queue.id);

    await this.save(updatedQueue);

    return worksheetRepo.findByIdWIthIncludes(updatedItem.worksheetId);
  }

  async update(queue, params) {
    const $merge = fromJSON(params, t.WorksheetQueueBody);
    const updatedQueue = t.update(queue, {$merge});
    return this.save(updatedQueue);
  }

  async deleteQueue(queue) {
    const qb = this.getQueryBuilder('delete');
    qb.where('id = ?', queue.id);
    return this.deleteQuery(qb);
  }

  async releaseWorksheetInQueue(queue, itemId) {
    const item = queue.findItemById(itemId);
    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`);
    }

    if (!item.canBeReleased()) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no puede ser liberador`);
    }

    queueDebug('releaseWorksheetInQueue', item.worksheetId, 'from queue', queue.id);
    const operatorId = item.operatorId;
    await WorksheetRepository.updateWorkSheetStatus(item.worksheetId, operatorId);

    if (item.status !== Queue.Status.SCHEDULED) {
      return this.removeWorksheetAndSave(queue.id, item.worksheetId);
    }

    return queue;
  }

  async removeScheduledWorksheet(queue, itemId, operatorId) {
    const item = queue.findItemById(itemId);

    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`);
    }

    const updatedItem = item.releaseSchedule(operatorId);
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem);
    const updatedQueue = t.update(queue, {worksheets: {$set: updatedWorksheets}});

    queueDebug('removeScheduleWorksheet', item.worksheetId, 'scheduled from queue ', queue.id);

    await this.save(updatedQueue);
  }

  async getScheduledWorksheets(queue, operatorId) {
    return queue.findScheduledItemsByOperatorId(operatorId);
  }

  async nextWorksheetInQueue(queue, operatorId) {
    const operatorItem = queue.findItemByOperatorId(operatorId);
    let nextAvailableItem = queue.findNextAvailableInQueue(operatorItem);
    let updatedQueue = queue;

    // add worksheet only if the bag it's empty
    if (!nextAvailableItem) {
      updatedQueue = await this.findNextAvailableInSource(queue);
      nextAvailableItem = updatedQueue.findNextAvailableInQueue(operatorItem);
    }

    if (!nextAvailableItem) {
      throw newHttpError(422, 'No hay items disponibles en la lista');
    }

    const releasedUpdatedQueue = operatorItem
      ? await this.releaseWorksheetInQueue(updatedQueue, operatorItem.id)
      : updatedQueue;

    return this.takeWorksheetInQueue(releasedUpdatedQueue, nextAvailableItem.id, operatorId);
  }

  async findNextAvailableInSource(queue) {
    const worksheetRepo = new WorksheetRepository();
    const [worksheet] = await worksheetRepo.findBySource(queue);

    if (worksheet) {
      return this.addWorksheetAndSave(queue.id, worksheet.id);
    }

    return queue;
  }

  async findItemByOperator(queueId, operatorId) {
    if (!queueId) {
      return null;
    }
    const queue = await this.findByIdOrThrow(queueId);
    return queue.findItemByOperatorId(operatorId);
  }

  async releaseTakenWorksheetInQueue(queueId, operatorId) {
    const queue = await this.findByIdOrThrow(queueId);
    const operatorItem = queue.findItemByOperatorId(operatorId);

    if (operatorItem) {
      await this.releaseWorksheetInQueue(queue, operatorItem.id);
    }
  }
}
