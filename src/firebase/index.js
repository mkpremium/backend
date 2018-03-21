import admin from 'firebase-admin';
import {firebase} from '../../config';

export default admin.initializeApp({
  credential: admin.credential.cert(firebase.serviceAccount),
  databaseURL: firebase.databaseURL
});
