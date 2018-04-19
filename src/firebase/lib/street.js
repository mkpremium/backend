import t from 'tcomb';
import _find from 'lodash/find';
import {firebaseStringToNumber, firebaseTimestampFormat} from '../../lib/date';
import {firebaseInformadores} from '../../../config';
import {isStreetManager} from '../index';
import {OperatorFeatures} from '../../types/operator';

export async function saveStreetUserToFirebase(operator) {
  if (!firebaseInformadores.enabled) {
    return;
  }

  const db = firebaseInformadores.database();
  db.ref(`Usuarios/${operator.id}/Datos`).set(toFirebaseStreetUser(operator));
  const adminRef = db.ref(`AdminUsers/${operator.id}`);
  adminRef.child('Permisos').set({
    Ciudades: stringToFirebasePreferences(operator.profile.city),
    Funciones: arrayToFirebasePreference(operator.features),
    Name: operator.profile.fullName(),
    Mail: operator.email,
    SuperSU: isStreetManager(operator.roles)
  });
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
