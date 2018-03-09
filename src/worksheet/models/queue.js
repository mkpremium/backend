import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import {CouchbaseModel, EmbeddedModel} from '../../db/model';
import {newHttpError} from '../../lib/http-error';
import {updateList} from '../../lib/tcomb-utils';
import {WorksheetRepository} from './worksheet';
import {utc} from '../../lib/date';

export class WorksheetQueue extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.WorksheetQueue;
  }

  async preSave(data) {
    await this.unique(data, 'city');

    return data;
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
  async findByCity(name) {
    const qb = this.getQueryBuilder()
      .where('city = ?', name)
      .limit(1);
    const [queue] = await this.query(qb);

    if (!queue) {
      throw newHttpError(404, `Cola para ciudad ${name} no encontrada`);
    }

    return fromJSON(queue, this.Struct);
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

  async addWorksheetAndSave(queue, worksheet) {
    const item = await this.addWorksheet(queue, worksheet);
    const updatedWorksheets = t.update(queue.worksheets, {$push: [item]});
    const updatedQueue = t.update(queue, {worksheets: {$set: updatedWorksheets}});
    return this.save(updatedQueue);
  }

  async addWorksheet(queue, worksheet) {
    const itemRepo = new QueueItemRepository();
    const worksheetRepo = new WorksheetRepository();

    if (worksheet.queueId) {
      throw newHttpError(409, `Worksheet ${worksheet.id} se encuentra en otra cola (${worksheet.queueId})`);
    }

    await worksheetRepo.save(t.update(worksheet, {queueId: {$set: queue.id}}));
    return itemRepo.save({worksheetId: worksheet.id});
  }

  async takeWorksheetInQueue(queue, itemId, operatorId) {
    const item = queue.findItemById(itemId);
    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`);
    }

    if (!item.canBeOpened()) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no esta disponible para su apertura`);
    }

    const operatorItem = queue.findItemByOperatorId(operatorId);

    if (operatorItem) {
      throw newHttpError(409, `El operador ${operatorId} ya ha tomado un item previamente`);
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

    await this.save(updatedQueue);

    return worksheetRepo.findByIdWIthIncludes(updatedItem.worksheetId);
  }

  async releaseWorksheetInQueue(queue, itemId) {
    const item = queue.findItemById(itemId);
    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`);
    }

    if (item.canBeOpened()) {
      throw newHttpError(409, `El ${itemId} (${item.status}) ya se encuentra abierto`);
    }

    const updatedItem = item.release();
    const updatedWorksheets = updateList(queue.worksheets, item, updatedItem);
    const updatedQueue = t.update(queue, {worksheets: {$set: updatedWorksheets}});

    return this.save(updatedQueue);
  }

  async nextWorksheetInQueue(queue, operatorId) {
    const operatorItem = queue.findItemByOperatorId(operatorId);
    const nextAvailableItem = queue.findNextAvailable(operatorItem);

    if (!nextAvailableItem) {
      throw newHttpError(422, 'No hay items disponibles en la lista');
    }

    const updatedQueue = operatorItem
      ? await this.releaseWorksheetInQueue(queue, operatorItem.id)
      : queue;

    return this.takeWorksheetInQueue(updatedQueue, nextAvailableItem.id, operatorId);
  }

  async releaseTakenWorksheetInQueue(cityName, operatorId) {
    const queue = await this.findByCity(cityName);
    const operatorItem = queue.findItemByOperatorId(operatorId);

    if (operatorItem) {
      await this.releaseWorksheetInQueue(queue, operatorItem.id);
    }
  }
}
