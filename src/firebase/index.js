import admin from 'firebase-admin';
import {firebase} from '../../config';

const fb = admin.initializeApp({
  credential: admin.credential.cert(firebase.serviceAccount),
  databaseURL: firebase.databaseURL
});

fb.enabled = firebase.enabled;

export default fb;
