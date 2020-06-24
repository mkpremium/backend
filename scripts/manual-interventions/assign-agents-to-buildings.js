import { N1qlQuery } from 'couchbase'

const { config } = require('dotenv')
config()

const app = require('../../src/app')
const { dependenciesPromise } = app

dependenciesPromise
  .then(async () => {
    // SELECT owner.buildingId, MIN(owner.business.meetingWithOperatorId) as assignedAgentId
    // from mkpremium owner
    // where owner._documentType = 'owner'
    // and owner.business.meetingWithOperatorId is not missing and owner.business.meetingWithOperatorId is not null
    // group by owner.buildingId
    const agentToBuildingAssignation = require('/tmp/buildings_assignation.json')
    const failedAssinations = [
      "6775ae41-1eae-4169-9dbc-93fe9c95a0dd",
      "f10c93aa-4d92-42f5-bbdf-6f7298e25b70",
      "cf6ad9bb-dd55-4aeb-899b-4f0f095ef417",
      "cc6e7f19-d9b1-47d9-b614-76ffdcccfe02",
      "01109cba-9187-4280-850a-71a06996606f",
      "539f8d8f-ca94-496a-b2f7-a445e490847e",
      "9d51c082-cc6a-45c7-b238-5bfca045d935",
      "c20853ba-bb1d-46d0-a520-a939e8605a2e",
      "a0318c3a-62db-49e3-87c5-0ba02c6ca6c0",
      "83344ffe-c20e-457f-bdce-a13c058c41ff",
      "d9fd3c39-1d4f-4669-8124-fcfd276f1354",
      "b5363396-1540-428d-ab85-7d2575072442",
      "d1217343-6c0c-4c33-9d5b-fb56996edc68",
      "d7f4c755-ddaa-4ea4-8e50-eb1a573169de",
      "ea1dba0b-b2f7-4a5a-b8c1-0a4c55b1eec6",
      "b0cba453-6730-470c-ae58-8f7c439ca701",
      "98e1f215-0380-44bf-ac35-36b716ac02cb",
      "5b391e4d-a4e3-48f4-a4bc-b9c0a34bd15b",
      "92bfbbdf-5274-440d-a303-1aa5a824a217",
      "c8522ca1-b904-44de-9132-a9e9a6e257e1",
      "1b30fdaa-b843-471f-9457-e1fd688f29f1",
      "544fac4c-1e6f-4df7-9a61-02add02405fb",
      "87627c5e-7c77-476e-8f81-a64eb92692f9",
      "97430fea-7f6e-4ac5-8715-0eb396289e8b",
      "82e50e8e-8742-47d1-8f6b-89761e72e860",
      "c2fd4373-240e-4b8f-9080-4721092331f2",
      "106d273b-c615-4d02-9123-887b005cca6a",
      "5af39f70-03a8-4fb4-871b-15523d586557",
      "49137d4c-baed-4d30-ae4e-5ac3fb07d2ee",
      "1fae9a21-11a0-45e2-b720-7e3ac4fe2366",
      "e089cb88-ade8-4ffc-aec9-bff14d03136a",
      "bd4c8b77-cd43-4df5-bde6-24f80b099b52",
      "dff2a685-3dcb-4d23-a0f6-53e5c5ddc5cf",
      "6de51374-73c0-4b7a-a578-06716085f1c9",
      "7c2f7340-86d5-4d14-be1d-077b082f3dc3",
      "8e5a6a1b-6930-4274-85dd-9317caedad5b",
      "bcb86722-ad8b-4b81-ac54-d4d70756da17",
      "32ebf05c-590f-4e84-9a88-4d628710bc27",
      "c73d6059-e951-4426-82ad-be3ee927ac45",
      "8f3e4868-6b8f-45a5-84df-9e7ace7a6e9b",
      "b0260d64-ded1-4ac4-939f-676665179621",
      "de962fe8-1575-4358-88d6-db8237029995",
      "0281a655-4d50-4878-8af0-caf6f51243f4",
      "71696ba7-0db6-4a21-8f05-99ffb98a6880",
      "1eb789a7-2e5a-40f3-a57e-b9e152c4772c",
      "1691b8e8-2b68-4c5a-a414-86eaad90bd00",
      "bf1c321e-8806-43cb-b431-5116bc559d34",
      "38be0593-a9cc-45fb-af82-e420b230f2a6",
      "dbcc61bb-491a-4343-b2cd-594268bb3d5c",
      "ff53f3a1-550a-4c4f-ae6f-fac4f020184d",
      "54612658-866a-459b-8414-9d44aaf8fec2",
      "502fb8ad-e75f-4d14-b76a-dd772b1ac4dc",
      "8439515e-a0a7-4f4d-8b8a-d696aedb7b3b",
      "39303785-7925-4a98-ac45-f8a65b841dde",
      "39935484-2c50-4acf-9d20-8abe82e5e160",
      "ea614ee2-8c54-46db-a78d-c296e8aa1e88",
      "a3f04206-a409-4d49-8a1b-26f8f6751621",
      "b9bb071d-6398-40d4-9d56-a4d3231b25ed",
      "fdda07d6-86a8-47cd-b56d-bfb57e817882",
      "c6ddf115-1843-40b0-9695-581bec34295d",
      "09d20d1f-4379-4168-90ab-459448b608a5",
      "5833f672-557e-4112-b093-b73593b35503",
      "3faabdfd-5609-428d-bac7-3259edd875b0",
      "2621528c-b76c-46f5-8a48-c413b0b68744",
      "93b0ba4a-b400-4459-9a6c-320c09845ce7",
      "e082fe04-438b-4093-8299-0a6b63c51824",
      "9040bc20-73fa-442c-a616-ed793e651afd",
      "00f0a191-9cae-47f6-b151-08a794d0d243",
      "ca2e8b69-91b5-4816-93c5-f14076c98794",
      "e4db2720-f724-4a50-9691-17c71db3dfa2",
      "ea7a32e3-a977-4036-86e0-c27737423b01",
      "4ead72cd-5244-4153-9567-4b74b57bbeb1",
      "bcfb612d-dead-41f0-9ac8-364d068c0a72",
      "cfe4ed1d-47a5-46eb-a5a9-404c91a7fea5",
      "ff4e8b61-0185-4e99-90e4-fe1d5d19a8bd",
      "ac2eaf7f-8954-4cb1-8b60-6df243c48dcd",
      "7906762e-99ca-4339-a94c-d1894cfe850d",
      "f68b8456-9d60-48b3-9e35-479d6bee2a44",
      "991828cf-1fb6-48cd-93da-854905caa7ce",
      "7c092f61-24fb-4488-81b2-7858401ed485",
      "fd264bf5-abc7-4e1c-81b5-3763cdafdb82",
      "6e522daa-2c7e-45ee-adc9-4c2191dcd215",
      "076f49ad-dc7c-4581-a012-bc9a152df1d7",
      "bfe6fba0-08a8-4858-9e32-d1db91882339",
      "fdbf3267-0655-44ab-afdc-69c3a1e2ebec",
      "99f3db9b-cce3-4277-9502-a5de3f731517",
      "e5930a2d-fca3-489c-997d-594724574990",
      "108badcf-2d5d-4d63-9fd3-43d1fadc1472",
      "07bdac7c-b2f8-442c-8a6f-6d26475c5a05",
      "c3d6e9bd-ef23-4b8c-ba89-5b62ae589ff3",
      "84334ba7-d7e5-4dce-8137-d9d979e3e7af",
      "1cf597a4-fa38-4ef3-a915-ac61793a0019",
      "1e4e2d3e-0583-418f-a3e4-b1938bbb3701",
      "8c44c77f-0464-4fbd-9e02-4b39715c1d59",
      "c5454eff-3ac7-4a31-a168-4202356acc73",
      "99640e66-be7c-4617-b35e-755f9268be63",
      "fde23707-3861-41ca-ac83-ee1a240bc708",
      "56b33dd9-1bab-4538-9e6e-ddd9348f24e6",
      "d4e74a49-8bf3-4ae3-bb58-c6bf069f3103"
    ]


    const { couchbaseAdapter } = app.default.locals.dependenciesContainer

    const errors = (await Promise.all(
        agentToBuildingAssignation.map(async ({ buildingId, assignedAgentId }) => {
          if (failedAssinations.indexOf(buildingId) === -1) {
            return
          }
          try {
            await couchbaseAdapter.queryAsync(
              N1qlQuery.fromString('UPDATE mkpremium SET assignedAgentId = $2 WHERE id = $1'), [ buildingId, assignedAgentId ]
            )
          } catch (e) {
            return { error: e, buildingId }
          }
        }))
    ).filter(res => res !== undefined)

    if (0 < errors.length) {
      console.error(JSON.stringify(errors))
      process.exit(1)
    }

    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
