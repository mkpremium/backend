import admin from 'firebase-admin'
import { firebaseComerciales, firebaseInformadores } from '../../config'
import { saveStreetUserToFirebase } from './lib/street'
import { isAdmin, isBusiness, isStreet } from '../lib/role-operators'
import { saveBusinessUserToFirebase } from './lib/business'

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
    return { enabled, prefixURL, database () {} }
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

export async function firebaseUserAccount (operator, newCity) {
  if (isStreet(operator.roles)) {
    return saveStreetUserToFirebase(operator, newCity)
  }

  if (isBusiness(operator.roles)) {
    return saveBusinessUserToFirebase(operator)
  }
}
