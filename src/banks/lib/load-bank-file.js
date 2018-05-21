import Promise from 'bluebird';
import fromJSON from 'tcomb/lib/fromJSON';
import * as XLSX from 'xlsx';
import _zipObject from 'lodash/zipObject';
import _isNumber from 'lodash/isNumber';
import {BanksCityDataRepository} from '../models';
import t from 'tcomb';
import couchbase from '../../db/couchbase';

const fieldNames = [
  'name',
  'population',
  'itp',
  'price',
  'priceCity',
  'rot'
];

function isEmpty(value) {
  if (_isNumber(value)) {
    return false;
  } else {
    return value.length === 0 || !value.trim();
  }
}

function cleanValues(values) {
  const cleanValues = [];
  values.forEach(value => {
    cleanValues.push(isEmpty(value) ? void 0 : value);
  });

  return cleanValues;
}

function rowToCity(values) {
  return _zipObject(fieldNames, cleanValues(values));
}

export class MigrateBankCityFile {
  constructor(filepath) {
    this.db = couchbase();
    this.filepath = filepath;
    this.importRow = this.importRow.bind(this);
    this.repo = new BanksCityDataRepository();
  }

  async importRow(row) {
    const parsedData = rowToCity(row);
    try {
      const data = fromJSON(parsedData, t.BanksCityData);
      return this.repo.save(data);
    } catch (e) {
      console.error('row', row, parsedData);
      throw e;
    }
  }

  async run() {
    const workbook = XLSX.readFile(this.filepath);
    const [firstSheet] = workbook.SheetNames;
    const options = {
      raw: true,
      header: 1,
      blankrows: false
    };

    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], options);
    await this.db;
    await Promise.each(sheet.slice(1), this.importRow);
  }
}

if (require.main === module) {
  const migrate = new MigrateBankCityFile(`${__dirname}/../fixtures/bank_city.xlsx`);
  migrate.run()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
