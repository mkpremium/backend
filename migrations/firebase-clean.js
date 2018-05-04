import Promise from 'bluebird';
import {fbInformadores, fbComerciales} from '../src/firebase';

async function cleanStreet() {
  const db = fbInformadores.database();

  return Promise.all([
    db.ref('AdminUsers').set(null),
    db.ref('Usuarios').set(null),
    db.ref('Chat_Answer').set(null),
    db.ref('Chat_Content').set(null),
    db.ref('Ciudad').set(null),
    db.ref('Edificios_Data').set(null),
    db.ref('Edificios_Mapping').set(null),
    db.ref('Locations').set(null),
    db.ref('Parameters').set(null),
    db.ref('Statistics').set(null)
  ]);
}

async function cleanBusiness() {
  const db = fbComerciales.database();

  return Promise.all([
    db.ref('Buildings').set(null),
    db.ref('Documents').set(null),
    db.ref('Entities').set(null),
    db.ref('Meetings').set(null),
    db.ref('Notes').set(null),
    db.ref('Proposes').set(null),
    db.ref('Reminders').set(null),
    db.ref('Users').set(null),
    db.ref('UsersRef').set(null)
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
