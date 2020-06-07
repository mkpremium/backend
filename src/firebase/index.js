import admin from 'firebase-admin'
import { firebaseComerciales, firebaseInformadores } from '../../config'
import { isAdmin, isBusiness, isStreet } from '../lib/role-operators'

export const fbComerciales = initializeFirebase(firebaseComerciales, 'comerciales')
export const fbInformadores = initializeFirebase(firebaseInformadores, 'informadores')

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

function choseFirebaseSetup (roles) {
  if (isBusiness(roles) || isAdmin(roles)) {
    return {
      fb: fbComerciales,
      databaseURL: firebaseComerciales.databaseURL
    }
  }

  if (isStreet(roles)) {
    return {
      fb: fbInformadores,
      databaseURL: firebaseInformadores.databaseURL
    }
  }

  return {}
}

export async function firebaseSetup (operator) {
  const { fb, databaseURL } = choseFirebaseSetup(operator.roles)

  if (!fb || !fb.enabled) {
    return
  }

  return {
    token: await fb.auth().createCustomToken(operator.id),
    databaseURL
  }
}
