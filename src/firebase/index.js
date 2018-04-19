import admin from 'firebase-admin';
import _intersection from 'lodash/intersection';
import {firebaseComerciales, firebaseInformadores} from '../../config';
import {OperatorRoles} from '../types/operator';
import {saveStreetUserToFirebase} from './lib/street';

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

function isBusiness(roles) {
  const {BUSINESS} = OperatorRoles;
  return roles.indexOf(BUSINESS) !== -1;
}

function isStreet(roles) {
  const {STREET, STREET_MANAGER} = OperatorRoles;
  return _intersection(roles, [STREET, STREET_MANAGER]).length > 0;
}

export function isStreetManager(roles) {
  const {STREET_MANAGER} = OperatorRoles;
  return _intersection(roles, [STREET_MANAGER]) === 1;
}
export function isAdmin(roles) {
  const {ADMIN} = OperatorRoles;
  return _intersection(roles, [ADMIN]) === 1;
}

function choseFirebaseSetup(roles) {
  if (isBusiness(roles)) {
    return {
      fb: fbComerciales,
      databaseURL: firebaseComerciales.databaseURL
    };
  }

  if (isStreet(roles)) {
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

export async function firebaseUserAccount(operator) {
  if (isStreet(operator.roles)) {
    await saveStreetUserToFirebase(operator);
  }
}
