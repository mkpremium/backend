import t from 'tcomb';
import '../types';
import uuid from 'uuid/v4';

/**
 * @swagger
 * definitions:
 *   BanksAddress:
 *     properties:
 *       type:
 *         type: string
 *       street:
 *         type: string
 *       number:
 *         type: number
 *       fullAddress:
 *         type: string
 *       city:
 *         type: string
 */
t.BanksAddress = t.struct(
  {
    type: t.String,
    street: t.String,
    number: t.Number,
    fullAddress: t.maybe(t.String),
    city: t.String
  },
  {
    name: 'BanksAddress'
  }
);

/**
 * @swagger
 * definitions:
 *   BankFile:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       filename:
 *         type: string
 *       processed:
 *         type: number
 *       total:
 *         type: number
 */
t.BankFile = t.struct(
  {
    id: t.String,
    filename: t.String,
    filepath: t.String,
    mimetype: t.String,
    processed: t.Number,
    total: t.Number,

    _documentType: t.enums.of(['bank-file'])
  },
  {
    name: 'BankFile',
    defaultProps: {
      get id() {
        return uuid();
      },
      processed: 0,
      total: 0,
      _documentType: 'bank-file'
    }
  }
);

t.BankFileResponse = t.struct({
  id: t.String,
  filename: t.String,
  processed: t.Number,
  total: t.Number
}, 'BankFileResponse');

t.ListBankFileResponse = t.struct(
  {
    results: t.list(t.BankFileResponse)
  }, {
    name: 'ListBankFileResponse',
    defaultProps: {
      results: []
    }
  }
);

t.BankFileData = t.struct(
  {
    id: t.String,
    bankFileId: t.String,
    bankFileRowData: t.Any,
    cadastreReference: t.String,
    priceBank: t.Number,
    priceZoneRaw: t.Number,
    priceZone: t.Number,
    priceSell: t.Number,
    priceCity: t.Number,
    rot: t.Number,
    itp: t.Number,
    m2: t.Number,
    population: t.Number,
    address: t.maybe(t.BanksAddress),
    location: t.maybe(t.struct({
      latitude: t.Number,
      longitude: t.Number
    }, 'location')),
    buy: t.Boolean,

    processed: t.Boolean,

    _documentType: t.enums.of(['bank-file-data'])
  },
  {
    name: 'BankFileDataRepository',
    defaultProps: {
      get id() {
        return uuid();
      },
      priceZoneRaw: 0,
      priceZone: 0,
      priceSell: 0,
      priceCity: 0,
      population: 0,
      rot: 0,
      m2: 0,
      itp: 10,
      buy: true,
      processed: false,
      _documentType: 'bank-file-data'
    }
  }
);

t.BankFileDataFilteredResponse = t.BankFileData.extend({
  filters: t.struct({
    population: t.Boolean,
    benefit: t.Boolean,
    priceSell: t.Boolean,
    blacklisted: t.Boolean
  }, 'filters')
}, 'BankFileFilteredResponse');

t.ListBankFileDataFilteredResponse = t.struct(
  {
    results: t.list(t.BankFileDataFilteredResponse)
  }, {
    name: 'ListBankFileDataFilteredResponse',
    defaultProps: {
      results: []
    }
  }
);

t.BankFilter = t.struct(
  {
    id: t.String,
    name: t.String,
    description: t.String,
    logic: t.String,
    value: t.Any,
    _documentType: t.enums.of(['bank-filter'])
  },
  {
    name: 'BankFilter',
    defaultProps: {
      get id() {
        return uuid();
      },
      _documentType: 'bank-filter'
    }
  }
);

t.BanksCityData = t.struct(
  {
    id: t.String,
    name: t.String,
    population: t.Number,
    itp: t.Number,
    price: t.Number,
    priceCity: t.Number,
    rot: t.Number,
    _documentType: t.enums.of(['bank-city-data'])
  },
  {
    name: 'BanksCityData',
    defaultProps: {
      get id() {
        return uuid();
      },
      price: 0,
      priceCity: 0,
      rot: 0,
      itp: 10,
      _documentType: 'bank-city-data'
    }
  }
);

/**
 * @swagger
 * definitions:
 *   Error:
 *     properties:
 *       message:
 *         type: string
 *   BankListResponse:
 *     properties:
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/BankFile"
 */

export default t;
