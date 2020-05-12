const admin = require('firebase-admin')

const app = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://mkpremiumcomerciales-bd40a.firebaseio.com/'
})

const db = app.database()

db.ref("Users/183d8c24-98a5-4f0b-bcd0-b14f2ffca457/Buildings")
  .once('value')
  .then(snapshot => console.log(JSON.stringify(snapshot.val())))
  .catch(console.error)
  .then(process.exit)

// const buildingWithMeeting = require('./building_ids_with_meeting')
// Promise.all(buildingWithMeeting.map(buildingId => {
//     const ref = db.ref(`Buildings/${buildingId}`)
//
//     // return ref.once('value')
//     //   .then(value => console.log(value.key))
//     //   .catch(reason => console.error(reason))
//     return ref.set(null)
//       .then(() => console.log("DELETED", buildingId))
//       .catch(reason => console.error("ERROR", buildingId, reason))
//   })
// ).then(() => process.exit())
//   .catch(reason => {
//     console.error(reason)
//     process.exit(1)
//   })
