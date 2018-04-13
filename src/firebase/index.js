import admin from 'firebase-admin';
import {firebaseComerciales, firebaseInformadores} from '../../config';
import {OperatorRoles} from '../types/operator';

export const fbComerciales = admin.initializeApp({
  credential: admin.credential.cert(firebaseComerciales.serviceAccount),
  databaseURL: firebaseComerciales.databaseURL
}, 'comerciales');

fbComerciales.enabled = firebaseComerciales.enabled;

export const fbInformadores = admin.initializeApp({
  credential: admin.credential.cert(firebaseInformadores.serviceAccount),
  databaseURL: firebaseInformadores.databaseURL
}, 'informadores');

fbInformadores.enabled = firebaseInformadores.enabled;

function choseFirebaseSetup(roles) {
  const {BUSINESS, STREET} = OperatorRoles;
  if (roles.indexOf(BUSINESS) !== -1) {
    return {
      fb: fbComerciales,
      databaseURL: firebaseComerciales.databaseURL
    };
  }
  if (roles.indexOf(STREET) !== -1) {
    return {
      fb: fbInformadores,
      databaseURL: firebaseInformadores.databaseURL
    };
  }

  return {};
}

export async function firebaseSetup(operator) {
  const {fb, databaseURL} = choseFirebaseSetup(operator.roles);

  if (!fb) {
    return;
  }

  return {
    token: await fb.auth().createCustomToken(operator.id),
    databaseURL
  };
}
