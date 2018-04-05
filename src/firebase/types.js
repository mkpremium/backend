import t from 'tcomb';

t.FirebaseBuildingData = t.struct({
  Aspiration: t.Number,
  Proposal: t.Number,
  State: t.maybe(t.String),
  Street: t.String,
  lat: t.Number,
  lng: t.Number
}, 'FirebaseBuildingData');

t.FirebaseMeeting = t.struct(
  {
    Aspiration: t.Number,
    Email: t.maybe(t.String),
    Favourite: t.Boolean,
    Name: t.String,
    PhoneNumber: t.maybe(t.String),
    Proposal: t.Number,
    Street: t.String,
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

export default t;
