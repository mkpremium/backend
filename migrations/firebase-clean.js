import Promise from 'bluebird';
import {fbInformadores, fbComerciales} from '../src/firebase';
import {firebaseComerciales, firebaseInformadores} from '../config';

async function cleanStreet() {
  const db = fbInformadores.database();
  if (!firebaseInformadores.enabled) {
    return;
  }

  return Promise.all([
    db.ref(`${fbInformadores.prefixURL}AdminUsers`).set(null),
    db.ref(`${fbInformadores.prefixURL}Usuarios`).set(null),
    db.ref(`${fbInformadores.prefixURL}Chat_Answer`).set(null),
    db.ref(`${fbInformadores.prefixURL}Chat_Content`).set(null),
    db.ref(`${fbInformadores.prefixURL}Ciudad`).set(null),
    db.ref(`${fbInformadores.prefixURL}Edificios_Data`).set(null),
    db.ref(`${fbInformadores.prefixURL}Edificios_Mapping`).set(null),
    db.ref(`${fbInformadores.prefixURL}Locations`).set(null),
    db.ref(`${fbInformadores.prefixURL}Parameters`).set(null),
    db.ref(`${fbInformadores.prefixURL}Statistics`).set(null)
  ]);
}

async function cleanBusiness() {
  const db = fbComerciales.database();

  if (!firebaseComerciales.enabled) {
    return;
  }

  return Promise.all([
    db.ref(`${fbComerciales.prefixURL}Buildings`).set(null),
    db.ref(`${fbComerciales.prefixURL}Documents`).set(null),
    db.ref(`${fbComerciales.prefixURL}Entities`).set(null),
    db.ref(`${fbComerciales.prefixURL}Meetings`).set(null),
    db.ref(`${fbComerciales.prefixURL}Notes`).set(null),
    db.ref(`${fbComerciales.prefixURL}Proposes`).set(null),
    db.ref(`${fbComerciales.prefixURL}Reminders`).set(null),
    db.ref(`${fbComerciales.prefixURL}Users`).set(null),
    db.ref(`${fbComerciales.prefixURL}UsersRef`).set(null)
  ]);
}

export async function cleanFirebase() {
  return Promise.all([
    cleanStreet(),
    cleanBusiness()
  ]);
}

if (require.main === module) {
  cleanFirebase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
