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
          'stock': [],
          'use': 'Residencial',
          'owners': [
            {
              'id': '169e02a9-b5a6-4f46-8fc4-b90f3076953d',
              'personId': '953b7501-f074-4b80-9775-121f3317249f'
            },
            {
              'featuredContact': null,
              'id': '4718e69d-55bf-4c59-86d7-570e43d953a0',
              'negotiationStatus': 'PENDIENTE',
              'personId': '388ae2f6-69be-4b4d-a368-658411d82570',
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
              'fullName': 'ESTEBAN SERRANO PATRICIA'
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

  it('parses owner contacts', () => {
    const result = CommercialsBuildingRepository.mapToPropertyAgentBuildingView([
      {
        'address': {
          'city': 'MADRID',
          'fullAddress': 'CL FRANCOS RODRIGUEZ 34, MADRID',
          'neighborhood': 'BELLAS VISTAS',
          'number': 34,
          'postalCode': {
            'number': '28039',
            'verified': true
          },
          'province': 'MADRID',
          'registerNumber': 26,
          'street': 'FRANCOS RODRIGUEZ',
          'type': 'CL',
          'zone': 'BELLAS VISTAS # TETUAN'
        },
        'buildingMeetings': [],
        'cadastreReference': '0487321VK4708G0001JA',
        'floorArea': 1112,
        'id': 'eef9bfbf-7422-4f33-b343-427c4f80e15d',
        'location': {
          'lat': 40.4562566,
          'lng': -3.7045277
        },
        'metadata': [
          {
            'id': '147f9a56-adac-4b65-9118-44df708e6a45',
            'mimeType': 'application/pdf',
            'name': '106197.pdf',
            'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/5306814e-5040-44cc-8eff-88e9d877a8bc.jpg'
          },
          {
            'id': 'd69f814f-5d10-46d8-a6d5-04a23876872b',
            'mimeType': 'image/jpeg',
            'name': '0487321VK4708G0001JA.jpg',
            'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/64a4bbfd-55ee-4712-9f7c-b2a063777320.jpg'
          },
          {
            'id': 'c90aa275-f6ad-489f-8b48-ac80fe62431f',
            'mimeType': 'application/pdf',
            'name': '0487321VK4708G0001JA.pdf',
            'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/2c898e31-b7b7-471a-9e17-efbf057a36d8.jpg'
          }
        ],
        'ownerId': 'a3d94192-ec4f-4bd9-b839-c1be9ff562da',
        'use': 'Residencial',
        'owners': [
          {
            'contacts': [
              {
                'id': 'f840f879-7474-4755-acab-0beadcbbd6ba',
                'note': null,
                'status': 'GOOD',
                'type': 'TELEFONO',
                'value': '639178031'
              }
            ],
            'featuredContact': null,
            'firstName': 'Maria',
            'fullName': 'MARIA LUISA GARCIA',
            'id': '498488cb-e5f1-436e-b074-f7efd9ae4c05',
            'personId': '6584555a-c053-4b74-b1c6-124f4b16ea87'
          }
        ]
      }
    ])

    expect(result[ 0 ].owner).to.be.deep.equal({
      id: '498488cb-e5f1-436e-b074-f7efd9ae4c05',
      firstName: 'Maria',
      featuredContact: undefined,
      name: 'MARIA LUISA GARCIA',
      contacts: [
        {
          'id': 'f840f879-7474-4755-acab-0beadcbbd6ba',
          'status': 'GOOD',
          'type': 'TELEFONO',
          'value': '639178031'
        }
      ]
    })
  })
})
