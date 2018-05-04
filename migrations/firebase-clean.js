import {fbInformadores} from '../src/firebase';

const db = fbInformadores.database();

db.ref('AdminUsers').set(null);
db.ref('Chat_Answer').set(null);
db.ref('Chat_Content').set(null);
db.ref('Ciudad').set(null);
db.ref('Edificios_Data').set(null);
db.ref('Edificios_Mapping').set(null);
db.ref('Locations').set(null);
db.ref('Parameters').set(null);
db.ref('Statistics').set(null);
