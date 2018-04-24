import t from 'tcomb';
import uuid from 'uuid/v4';
import {OperatorFirebaseStates} from '../types/operator';

t.Neighborhood = t.struct(
  {
    id: t.String,
    name: t.String,
    zone: t.String,
    city: t.String,
    location: t.Location,
    _documentType: t.enums.of(['neighborhood'])
  },
  {
    name: 'Neighborhood',
    defaultProps: {
      get id() {
        return uuid();
      },
      _documentType: 'neighborhood'
    }
  }
);

t.City = t.struct(
  {
    id: t.String,
    name: t.String,
    location: t.Location,
    _documentType: t.enums.of(['city'])
  },
  {
    name: 'City',
    defaultProps: {
      get id() {
        return uuid();
      },
      _documentType: 'city'
    }
  }
);

t.ChangeUserNeighborhoodBody = t.struct({
  userId: t.String,
  neighborhood: t.String,
  city: t.String
}, 'ChangeUserNeighborhoodBody');

t.ChangeUserNeighborhoodBody.prototype.toParams = function() {
  const {neighborhood, city} = this;
  return {neighborhood, city};
};

t.ChangeUserStateBody = t.struct({
  userId: t.String,
  state: t.OperatorFirebaseStates
});

t.ChangeUserStateBody.prototype.toParams = function() {
  const {state} = this;
  const enable = state !== OperatorFirebaseStates.BLOCKED;

  return {
    enable,
    profile: {state}
  };
};

t.QueryNeighborhoodCenter = t.struct({
  Barrio: t.maybe(t.String),
  Ciudad: t.maybe(t.String)
}, 'QueryNeighborhoodCenter');

t.QueryBuildingsLocation = t.struct({
  city: t.String
});

t.QueryLoginCredentials = t.struct({
  name: t.String,
  password: t.String
});

t.QueryLoginCredentials.prototype.toParams = function() {
  return {
    username: this.name,
    password: this.password
  };
};

t.QueryLocationsAtDay = t.struct({
  date: t.String
});

export default t;
