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
    city: t.String,
    province: t.String
  },
  {
    name: 'BanksAddress'
  }
);

t.CadastreResponse = t.struct(
  {
    address: t.BanksAddress,
    use: t.String,
    m2: t.Number
  },
  {
    name: 'CadastreResponse'
  }
);

/**
 * @swagger
 * definitions:
 *   BankFilterUserInput:
 *     properties:
 *       discount:
 *         type: number
 *       population:
 *         type: number
 *       benefit:
 *         type: number
 *       priceSell:
 *         type: number
 *       blacklisted:
 *         type: array
 *         items:
 *           type: string
 *       whitelisted:
 *         type: array
 *         items:
 *           type: string
 */
t.BankFilterUserInput = t.struct(
  {
    discount: t.maybe(t.Number),
    population: t.maybe(t.Number),
    benefit: t.maybe(t.Number),
    priceSell: t.maybe(t.Number),
    blacklisted: t.list(t.String),
    whitelisted: t.list(t.String)
  },
  {
    name: 'BankFilterUserInput',
    defaultProps: {
      blacklisted: [],
      whitelisted: []
    }
  }
);

/**
 * @swagger
 * definitions:
 *   BankFilterUpdateInput:
 *     properties:
 *       bankFileDataIds:
 *         required: true
 *         type: array
 *         items:
 *           type: string
 */
t.BankFilterUpdateInput = t.struct({
  id: t.String,
  action: t.enums.of(['blacklisted', 'whitelisted']),
  bankFileDataIds: t.list(t.String)
}, 'BankFilterUpdateInput');

/**
 * @swagger
 * definitions:
 *   BankFileExportInput:
 *     properties:
 *       buy:
 *         type: boolean
 */
t.BankFileExportInput = t.struct({
  buy: t.Boolean
}, 'BankFileExportInput');

t.BankFilterResult = t.struct(
  {
    population: t.Boolean,
    benefit: t.Boolean,
    priceSell: t.Boolean,
    blacklisted: t.Boolean,
    whitelisted: t.Boolean
  },
  {
    name: 'BankFilterResult'
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
 *       errors:
 *         type: number
 *
 *   BankFileDetails:
 *     properties:
 *       bankFile:
 *         $ref: "#/definitions/BankFile"
 *       bankFileData:
 *         type: array
 *         items:
 *           $ref: "#/definitions/BankFileData"
 */
t.BankFile = t.struct(
  {
    id: t.String,
    filename: t.String,
    filepath: t.String,
    mimetype: t.String,
    processed: t.Number,
    errors: t.Number,
    total: t.Number,

    createdAt: t.Date,

    userInput: t.BankFilterUserInput,

    _documentType: t.enums.of(['bank-file'])
  },
  {
    name: 'BankFile',
    defaultProps: {
      get id() {
        return uuid();
      },
      get createdAt() {
        return new Date();
      },
      processed: 0,
      total: 0,
      errors: 0,
      userInput: {
        discount: 0,
        blacklisted: [],
        whitelisted: []
      },
      _documentType: 'bank-file'
    }
  }
);

t.BankFileResponse = t.struct({
  id: t.String,
  filename: t.String,
  processed: t.Number,
  total: t.Number,
  errors: t.Number,
  userInput: t.maybe(t.BankFilterUserInput)
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

/**
 * @swagger
 * definitions:
 *   BankFileData:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       bankFileId:
 *         type: string
 *         format: uuid/v4
 *       cadastreReference:
 *         type: string
 *         description: Referencia catastral
 *       priceBank:
 *         type: number
 *       priceZoneRaw:
 *         type: number
 *         description: "Precio por M²"
 *       priceZone:
 *         type: number
 *         description: "Precio por M²"
 *       priceSell:
 *         type: number
 *       priceInvest:
 *         type: number
 *       priceCity:
 *         type: number
 *         description: "Precio por M²"
 *       rot:
 *         type: number
 *       itp:
 *         type: number
 *       m2:
 *         type: number
 */
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
    priceInvest: t.Number,
    benefit: t.Number,
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
    filters: t.BankFilterResult,

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
      priceInvest: 0,
      benefit: 0,
      rot: 0,
      m2: 0,
      itp: 10,
      buy: true,
      processed: false,
      filters: {
        population: false,
        benefit: false,
        priceSell: false,
        blacklisted: false,
        whitelisted: false
      },
      _documentType: 'bank-file-data'
    }
  }
);

t.ListBankFileData = t.struct(
  {
    results: t.list(t.BankFileData)
  }, {
    name: 'ListBankFileData',
    defaultProps: {
      results: []
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
