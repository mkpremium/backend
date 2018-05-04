import admin from 'firebase-admin';
import {firebaseComerciales, firebaseInformadores} from '../../config';
import {saveStreetUserToFirebase} from './lib/street';
import {isBusiness, isStreet} from '../lib/role-operators';
import {saveBusinessUserToFirebase} from './lib/business';

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

export async function firebaseUserAccount(operator, newCity) {
  if (isStreet(operator.roles)) {
    await saveStreetUserToFirebase(operator, newCity);
  }

  if (isBusiness(operator.roles)) {
    await saveBusinessUserToFirebase(operator);
  }
}
