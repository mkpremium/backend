import t from 'tcomb';
import _find from 'lodash/find';
import {firebaseStringToNumber, firebaseTimestampFormat} from '../../lib/date';
import {firebaseInformadores} from '../../../config';
import {isStreetManager} from '../index';
import {OperatorFeatures} from '../../types/operator';

export async function saveStreetUserToFirebase(operator, newCity = true) {
  if (!firebaseInformadores.enabled) {
    return;
  }

  const db = firebaseInformadores.database();
  const adminRef = db.ref(`AdminUsers/${operator.id}`);
  const userRef = db.ref(`Usuarios/${operator.id}`);
  userRef.child('Datos').set(toFirebaseStreetUser(operator));
  if (newCity) {
    userRef.child('Edificio_Default').set(null);
  }

  adminRef.child('Permisos').set({
    Ciudades: stringToFirebasePreferences(operator.profile.city),
    Funciones: arrayToFirebasePreference(operator.features),
    Name: operator.profile.fullName(),
    Mail: operator.email,
    SuperSU: isStreetManager(operator.roles)
  });
}

export async function saveStreetBuildingToFirebase(building, owner) {
  const db = firebaseInformadores.database();
  db.ref(`Edificios_Data/${building.id}`).update(toFirebaseStreetBuilding(building, owner));
}

function stringToFirebasePreferences(string) {
  if (OperatorFeatures.ALL === string) {
    return OperatorFeatures.ALL;
  } else {
    return {[string]: true};
  }
}

function arrayToFirebasePreference(value) {
  if (_find(value, OperatorFeatures.ALL)) {
    return OperatorFeatures.ALL;
  } else {
    return value.reduce((acc, val) => {
      acc[val] = true;
      return acc;
    }, {});
  }
}

function toFirebaseStreetUser(operator) {
  const {firstName, lastName, neighborhood, zone, city, state} = operator.profile;
  return t.FirebaseUserStreet({
    Datos: {
      Nombre: firstName,
      Apellido: lastName,
      Barrio: neighborhood,
      Ciudad: city,
      Distrito: zone,
      Estado: state,
      Fecha_Alta: firebaseTimestampFormat(operator.createdAt),
      Fecha_Baja: firebaseTimestampFormat(operator.disabledAt),
      Numero_Agente: firebaseStringToNumber(operator.agentNumber),
      Numero_Nivel: firebaseStringToNumber(operator.level),
      Timestamp: firebaseTimestampFormat(new Date())
    }
  });
}

function toFirebaseStreetBuilding(building, owner) {
  return t.FirebaseStreetBuildingData({
    Id_Estado: building.Id_Estado,
    Id_building: building.id,
    Calle_Completa: building.address.fullAddress,
    Tipo_Calle: building.address.type,
    Ciudad: building.address.city,
    Nombre_Calle: building.address.street,
    Numero_Calle: building.address.number,
    Barrio: building.address.neighborhood,
    Distrito: building.address.zone,
    Foto: null,
    Propietario: owner.fullName(),
    Telefono: owner.findFirstGoodContact(),
    Gps_Lat: building.address.location.lat,
    Gps_Lon: building.address.location.lng,
    Timestamp: firebaseTimestampFormat(new Date())
  });
}

export function fromFirebaseStreetBuilding(firebase) {
  const building = {
    id: firebase.Id_building,
    Id_Estado: firebase.Id_Estado,
    address: {
      fullAddress: firebase.Calle_Completa,
      type: firebase.Tipo_Calle,
      city: firebase.Ciudad,
      street: firebase.Nombre_Calle,
      number: firebase.Numero_Calle,
      neighborhood: firebase.Barrio,
      zone: firebase.Distrito,
      location: {
        lat: firebase.Gps_Lat,
        lng: firebase.Gps_Lon
      }
    }
  };
  const owner = {
    name: firebase.Propietario,
    contact: firebase.Telefono
  };

  return {building, owner};
}
