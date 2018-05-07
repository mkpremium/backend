import debug from 'debug';
import Promise from 'bluebird';
import _find from 'lodash/find';
import _get from 'lodash/get';
import t from './../types/street';
import {firebaseStringToNumber, firebaseTimestampFormat} from '../../lib/date';
import {fbInformadores} from '../';
import {OperatorFeatures} from '../../types/operator';
import {isOnlyStreet, isStreetAdmin} from '../../lib/role-operators';

const debugStreet = debug('app:firebase:street');

export async function saveStreetUserToFirebase(operator, newCity = true) {
  if (!fbInformadores.enabled) {
    return;
  }

  const db = fbInformadores.database();
  const ops = [];

  if (isOnlyStreet(operator.roles)) {
    debugStreet('saveStreetUserToFirebase', 'street', operator.id);
    const userRef = db.ref(`${fbInformadores.prefixURL}Usuarios/${operator.id}`);
    ops.push(userRef.child('Datos').set(toFirebaseStreetUser(operator)));
    if (newCity) {
      ops.push(userRef.child('Edificio_Default').set(null));
    }
  } else {
    debugStreet('saveStreetUserToFirebase', 'admin', operator.id);
    const adminRef = db.ref(`${fbInformadores.prefixURL}AdminUsers/${operator.id}`);
    ops.push(adminRef.child('Permisos').set({
      Ciudades: arrayToFirebasePreference(operator.profile.city),
      Funciones: arrayToFirebasePreference(operator.features),
      Name: operator.profile.fullName(),
      Mail: operator.email,
      SuperSU: isStreetAdmin(operator.roles)
    }));
  }

  return Promise.all(ops);
}

export async function saveStreetBuildingToFirebase(building, owner) {
  if (!fbInformadores.enabled) {
    return;
  }
  debugStreet('saveStreetBuildingToFirebase', building.id);
  const db = fbInformadores.database();
  return db.ref(`${fbInformadores.prefixURL}Edificios_Data/${building.id}`).set(toFirebaseStreetBuilding(building, owner));
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
  const {firstName, lastName, neighborhood, city, state} = operator.profile;
  return t.FirebaseUserStreet({
    Nombre: firstName,
    Apellido: lastName,
    Barrio: neighborhood,
    Ciudad: arrayToFirebasePreference(city),
    Estado: state,
    Fecha_Alta: firebaseTimestampFormat(operator.createdAt),
    Fecha_Baja: firebaseTimestampFormat(operator.disabledAt),
    Numero_Agente: firebaseStringToNumber(operator.agentNumber),
    Numero_Nivel: firebaseStringToNumber(operator.level),
    Timestamp: firebaseTimestampFormat(new Date())
  });
}

function toFirebaseStreetBuilding(building) {
  debugStreet('toFirebaseStreetBuilding', building, building.owner);
  return t.FirebaseStreetBuildingData({
    Id_Estado: building.Id_Estado,
    Id_Edificio: building.id,
    Calle_Completa: building.address.fullAddress,
    Tipo_Calle: building.address.type,
    Ciudad: building.address.city,
    Nombre_Calle: building.address.street,
    Numero_Calle: String(building.address.number),
    Barrio: building.address.neighborhood,
    Distrito: building.address.zone,
    Foto: null,
    Propietario: _get(building, 'owner.name', ''),
    Telefono: _get(building, 'owner.phones.0.value', ''),
    Gps_Lat: building.location.lat,
    Gps_Lon: building.location.lng,
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
