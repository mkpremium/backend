import t from 'tcomb';
import '../types';
import uuid from 'uuid/v4';

t.BankFile = t.struct(
  {
    id: t.String,
    filename: t.String,
    filepath: t.String,

    _documentType: t.enums.of(['bank-file'])
  },
  {
    name: 'BankFile',
    defaultProps: {
      get id() {
        return uuid();
      },
      _documentType: 'bank-file'
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
    location: t.maybe(t.Address),
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
      _documentType: 'bank-city-data'
    }
  }
);

export default t;
