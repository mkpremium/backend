import t from 'tcomb';

export const FirebaseBuildingData = t.struct({
  Aspiration: t.Number,
  Proposal: t.Number,
  State: t.maybe(t.String),
  Street: t.String,
  Address: t.Any,
  Cadastre: t.Any,
  lat: t.Number,
  lng: t.Number
}, 'FirebaseBuildingData');

export const FirebaseMeeting = t.struct(
  {
    Aspiration: t.Number,
    Email: t.maybe(t.String),
    Favourite: t.Boolean,
    Name: t.String,
    PhoneNumber: t.maybe(t.String),
    Proposal: t.Number,
    Street: t.String,
    inPerson: t.Boolean,
    businessOperatorId: t.maybe(t.String),
    buildingID: t.String,
    dateCreation: t.Number,
    dateMeeting: t.Number
  },
  {
    name: 'FirebaseMeeting',
    defaultProps: {
      Favourite: false,
      Proposal: 0,
      Aspiration: 0
    }
  }
);

t.FirebaseDocument = t.struct(
  {
    DocumentName: t.maybe(t.String),
    Url: t.String,
    Thumbnail: t.maybe(t.String),
    date: t.Number
  },
  {
    name: 'FirebaseDocument',
    defaultProps: {
      DocumentName: '',
      ThumbNail: ''
    }
  }
);

t.FirebaseBuildingProposal = t.struct(
  {
    Accepted: t.Boolean,
    Aspiration: t.struct({
      Value: t.Number,
      ReceptionDate: t.Number
    }, 'aspiration'),
    LastDate: t.Number,
    SendDate: t.Number,
    Value: t.Number
  },
  {
    name: 'FirebaseBuildingProposal'
  }
);

t.FirebaseBuildingEntity = t.struct({
  Entity: t.String,
  Expiration: t.Number,
  Rent: t.Number,
  Situation: t.String,
  Surface: t.Number,
  Type: t.String
}, 'FirebaseBuildingEntity');

export default t;
