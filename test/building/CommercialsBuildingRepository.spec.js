import { expect } from 'chai'
import { CommercialsBuildingRepository } from '../../src/building/CommercialsBuildingRepository'

describe('CommercialsBuildingRepository', () => {
  describe('mapToPropertyAgentBuildingView', () => {
    it('parses featured owner', () => {
      const result = CommercialsBuildingRepository.mapToPropertyAgentBuildingView([
        {
          'address': {
            'city': 'BARCELONA',
            'fullAddress': 'CL AVINYO 24',
            'neighborhood': 'EL GÒTIC',
            'number': 24,
            'postalCode': {
              'number': '08002',
              'verified': true
            },
            'province': 'BARCELONA',
            'registerNumber': 24,
            'street': 'AVINYO',
            'type': 'CL',
            'zone': 'EL GÒTIC  #  CIUTAT VELLA'
          },
          'buildingMeetings': [
            {
              'eventDate': '2020-05-22T00:00:00.000Z',
              'ownerId': '4718e69d-55bf-4c59-86d7-570e43d953a0'
            }
          ],
          'cadastreReference': '1215910DF3811E0001LO',
          'floorArea': 702,
          'id': '3e0cfcf0-83c5-4342-8b9a-47bb40af07eb',
          'location': {
            'lat': 41.3809339,
            'lng': 2.1769568
          },
          'metadata': [
            {
              'id': 'cc6f211e-2891-4644-9e77-10bbf596e8ac',
              'mimeType': 'application/pdf',
              'name': '18947.pdf',
              'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/ec0cc52c-2f03-4e6e-9a69-b0adf3ecfd18.jpg'
            },
            {
              'id': 'a268dd65-b4c3-4c3f-831e-a7f909e57e31',
              'mimeType': 'image/jpeg',
              'name': '1215910DF3811E0001LO.jpg',
              'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/f1bb61b2-e9bd-4954-8e3e-47772b4a4e96.jpg'
            },
            {
              'id': 'ba6ad2fb-33d3-4c11-a9dc-a16c72a65783',
              'mimeType': 'application/pdf',
              'name': '1215910DF3811E0001LO.pdf',
              'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/763c7ffd-f2e4-44c8-ac7b-8c60a1893056.jpg'
            }
          ],
          'ownerId': null,
          'personOwners': [
            {
              'contacts': [
                {
                  'id': 'bd7677b6-5b53-4fcc-9290-398a9386f244',
                  'note': null,
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '627029887'
                },
                {
                  'id': 'ed5823c2-80fb-4900-a72b-42dc7f7ec140',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'EMAIL',
                  'value': 'p.e.s_7@hotmail.com'
                }
              ],
              'firstName': 'PATRICIA',
              'fullName': 'ESTEBAN SERRANO PATRICIA',
              'id': '388ae2f6-69be-4b4d-a368-658411d82570'
            }
          ],
          'stock': [],
          'use': 'Residencial',
          'verifiedOwners': [
            {
              'id': '169e02a9-b5a6-4f46-8fc4-b90f3076953d',
              'personId': '953b7501-f074-4b80-9775-121f3317249f'
            },
            {
              'featuredContact': null,
              'id': '4718e69d-55bf-4c59-86d7-570e43d953a0',
              'negotiationStatus': 'PENDIENTE',
              'personId': '388ae2f6-69be-4b4d-a368-658411d82570'
            },
            {
              'id': '1e7a0970-4b8b-4571-b24c-ebc329b20765',
              'personId': 'be90cf98-4f8d-441e-82e6-c11ef99bd787'
            }
          ]
        }
      ])

      expect(result[ 0 ].owner).to.be.deep.equal({
        id: '4718e69d-55bf-4c59-86d7-570e43d953a0',
        firstName: 'PATRICIA',
        featuredContact: undefined,
        name: 'ESTEBAN SERRANO PATRICIA',
        contacts: [
          {
            'id': 'bd7677b6-5b53-4fcc-9290-398a9386f244',
            'status': 'GOOD',
            'type': 'TELEFONO',
            'value': '627029887'
          },
          {
            'id': 'ed5823c2-80fb-4900-a72b-42dc7f7ec140',
            'status': 'GOOD',
            'type': 'EMAIL',
            'value': 'p.e.s_7@hotmail.com'
          }
        ]
      })
    })
  })
})
