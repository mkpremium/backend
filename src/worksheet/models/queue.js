import t from 'tcomb';
import {CouchbaseModel, EmbeddedModel} from '../../db/model';
import {newHttpError} from '../../lib/http-error';

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
    const [city] = await this.query(qb);

    if (!city) {
      throw newHttpError(404, `Cola para ciudad ${name} no encontrada`);
    }

    return new this.Struct(city);
  }

  async addWorksheetAndSave(queue, worksheet) {
    const item = await this.addWorksheet(queue, worksheet);
    const updatedWorksheets = t.update(queue.worksheets, {$push: [item]});
    const updatedQueue = t.update(queue, {worksheets: {$set: updatedWorksheets}});
    return this.save(updatedQueue);
  }

  async addWorksheet(queue, worksheet) {
    const itemRepo = new QueueItemRepository();
    if (worksheet.queue) {
      throw newHttpError(409, `Worksheet ${worksheet.id} se encuentra en otra cola (${worksheet.queue})`);
    }

    return itemRepo.save({worksheetId: worksheet.id});
  }

  async openWorksheetInQueue(queue, itemId) {
    const item = queue.findItemById(itemId);
    if (!item) {
      throw newHttpError(400, `El ${itemId} item no fue encontrado en la cola`);
    }

    if (!item.canBeOpened()) {
      throw newHttpError(409, `El ${itemId} (${item.status}) no esta disponible para su apertura`);
    }

    const itemIndex = queue.worksheets.indexOf(item);
    const updatedItem = item.open();
    const updatedWorksheets = t.update(queue.worksheets, {[itemIndex]: {$set: updatedItem}});
    const updatedQueue = t.update(queue, {worksheets: {$set: updatedWorksheets}});

    return this.save(updatedQueue);
  }
}
