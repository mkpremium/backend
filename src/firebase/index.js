import admin from 'firebase-admin'
import { firebaseComerciales } from '../../config'

export const fbComerciales = initializeFirebase(firebaseComerciales, 'comerciales')

function initializeFirebase ({ enabled, serviceAccount, databaseURL, prefixURL }, name) {
  if (enabled) {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL
    }, name)

    return Object.assign(app, {
      enabled,
      prefixURL
    })
  } else {
    return {
      enabled,
      prefixURL,
      database () {
        return {
          ref: () => ({ set: () => null })
        }
      }
    }
  }
}

export async function firebaseSetup (operatorId) {
  if (!fbComerciales.enabled) {
    return
  }

  return {
    token: await fbComerciales.auth().createCustomToken(operatorId),
    databaseURL: firebaseComerciales.databaseURL
  }
}
