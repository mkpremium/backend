import { CallcenterView } from '../../../src/worksheet/repository/worksheet.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'

describe('worksheet.repository', () => {
  it('parses callcenter view', () => {
    fromJSON([
      {
        'id': 'f694e660-e394-4166-bd54-95a3a6a9231c',
        'queueId': null,
        'relatedBuildings': [
          {
            'address': {
              'city': 'MADRID',
              'fullAddress': 'CL PRINCESA 24, MADRID',
              'neighborhood': 'UNIVERSIDAD',
              'number': 24,
              'postalCode': {
                'number': '28008',
                'verified': true
              },
              'province': 'MADRID',
              'registerNumber': 27,
              'street': 'PRINCESA',
              'type': 'CL',
              'zone': 'UNIVERSIDAD # CENTRO'
            },
            'cadastre': {
              'address': 'CL PRINCESA 2428008 MADRID (MADRID)',
              'reference': '9757805VK3795F0001RZ'
            },
            'featuredOwnerId': null,
            'floorArea': 3762,
            'id': 'ba0b39e3-c49d-43da-971a-f8b07d8660ac',
            'location': {
              'lat': 40.4274918,
              'lng': -3.7137333
            },
            'metadata': [
              {
                'id': 'ae8e6d30-ca94-4b05-abc1-11cdd685026c',
                'mimeType': 'application/pdf',
                'name': '122671.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/e36fc952-3184-4c11-ac4f-a95557b79797.jpg'
              },
              {
                'id': '339de815-61ca-4cf3-a4fa-e2bd1f30a7f4',
                'mimeType': 'image/jpeg',
                'name': '9757805VK3795F0001RZ.jpg',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/e4098779-34ed-4f7e-a4a4-856ad7c56ce2.jpg'
              },
              {
                'id': '7f8e7752-76d6-4798-86b5-0c3a1c3efa78',
                'mimeType': 'application/pdf',
                'name': '9757805VK3795F0001RZ.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/6f4c153a-6d6f-494d-9d99-741543478b27.jpg'
              }
            ],
            'recentProposal': null,
            'use': 'Residencial'
          }
        ],
        'relatedOwners': [
          {
            'featuredContact': null,
            'id': '00d445b8-6ba1-4c96-87f1-4d1741e8d3a1',
            'name': 'FITZ JAMES STUART MARTINEZ DE IRUJO CARLO',
            'person': {
              'contacts': [
                {
                  'id': '2504256f-64ff-4c94-9323-a58cf36eceab',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '954213318'
                },
                {
                  'id': '0af25ec3-23a7-4b11-94ed-578030633ab7',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '630918379'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'PRINCIPAL'
          },
          {
            'featuredContact': null,
            'id': '23a6fc06-d1c9-444f-9a2c-3ed6b5f592b8',
            'name': 'FITZ JAMES STUART MARTINEZ DE IRUJO CARLO',
            'person': {
              'contacts': [
                {
                  'id': '2504256f-64ff-4c94-9323-a58cf36eceab',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '954213318'
                },
                {
                  'id': '0af25ec3-23a7-4b11-94ed-578030633ab7',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '630918379'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'PRINCIPAL'
          },
          {
            'featuredContact': null,
            'id': '2ffcb2e4-fa89-499d-a3f5-38bc0c1e6957',
            'name': 'FITZ JAMES STUART MARTINEZ DE IRUJO CARLO',
            'person': {
              'contacts': [
                {
                  'id': '2504256f-64ff-4c94-9323-a58cf36eceab',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '954213318'
                },
                {
                  'id': '0af25ec3-23a7-4b11-94ed-578030633ab7',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '630918379'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'PRINCIPAL'
          },
          {
            'featuredContact': null,
            'id': '9f4c7083-151d-43fb-8fd6-26a50e5b2d3c',
            'name': 'FITZ JAMES STUART MARTINEZ DE IRUJO CARLO',
            'person': {
              'contacts': [
                {
                  'id': '2504256f-64ff-4c94-9323-a58cf36eceab',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '954213318'
                },
                {
                  'id': '0af25ec3-23a7-4b11-94ed-578030633ab7',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '630918379'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'PRINCIPAL'
          }
        ],
        'status': 'LOOKING_MEETING'
      },
      {
        'id': '70681185-3fec-4923-b1e0-6122dc46a4aa',
        'queueId': null,
        'relatedBuildings': [
          {
            'address': {
              'city': 'MADRID',
              'fullAddress': 'CL MONTE ESQUINZA 528010 MADRID (MADRID)',
              'neighborhood': 'ALMAGRO',
              'number': 5,
              'postalCode': {
                'number': '28010',
                'verified': true
              },
              'province': 'MADRID',
              'registerNumber': 28,
              'street': 'MONTE ESQUINZA',
              'type': 'CL',
              'zone': 'ALMAGRO # CHAMBERI'
            },
            'cadastre': {
              'address': 'CL MONTE ESQUINZA 528010 MADRID (MADRID)',
              'reference': '1355311VK4715E0001ZG'
            },
            'featuredOwnerId': null,
            'floorArea': 1178,
            'id': '9cfd2202-392b-454a-8cf7-083945eef96a',
            'location': {
              'lat': 40.4265386,
              'lng': -3.6924212
            },
            'metadata': [
              {
                'id': '8c5cbda4-a397-405b-ab32-1db40928a3fa',
                'mimeType': 'application/pdf',
                'name': '117829.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/16a80fae-f4e1-4f89-b7b5-db4641dea91c.jpg'
              },
              {
                'id': '62b57638-1537-4152-894f-0f51710dc7f9',
                'mimeType': 'image/jpeg',
                'name': '1355311VK4715E0001ZG.jpg',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/afb3735a-ff8f-41d0-83db-28dbf74291f3.jpg'
              },
              {
                'id': 'd5f10160-288a-4f64-9dcb-98b37c1b065d',
                'mimeType': 'application/pdf',
                'name': '1355311VK4715E0001ZG.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/44ada9c5-6d30-4f27-b057-8a5cda08c5d2.jpg'
              }
            ],
            'recentProposal': null,
            'use': 'Residencial'
          }
        ],
        'relatedOwners': [
          {
            'featuredContact': null,
            'id': '446c734e-4c5e-4de4-bbc6-60a086e74596',
            'name': 'OCHOA BLANCO',
            'person': {
              'contacts': [
                {
                  'id': '9118c7a6-97c3-4f24-986f-cdf9936b7d6f',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '619306494'
                },
                {
                  'id': '698eab62-b648-4ff9-8379-ec0f976dec48',
                  'note': '',
                  'status': 'BAD',
                  'type': 'EMAIL',
                  'value': 'tamarindocoliadres@gmail.com'
                },
                {
                  'id': 'e559fd86-5ffe-4b8c-8dac-ee504a14f1db',
                  'note': '',
                  'status': 'BAD',
                  'type': 'EMAIL',
                  'value': 'tamarindocoliades@gmail.com'
                },
                {
                  'id': '4232fa98-2cdd-44be-8a88-8060528eeb17',
                  'note': '',
                  'status': 'BAD',
                  'type': 'EMAIL',
                  'value': 'tamarindocolindres@hotmail.com'
                },
                {
                  'id': '9909900d-6508-45e4-ac8b-eef6fb7d6649',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'EMAIL',
                  'value': 'tamarindocolindres@gmail.com'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'NINGUNO'
          }
        ],
        'status': 'LOOKING_MEETING'
      },
      {
        'id': '8ad24305-0dd2-41cf-859f-36d14b489c3f',
        'queueId': null,
        'relatedBuildings': [
          {
            'address': {
              'city': 'MADRID',
              'fullAddress': 'CL SIERRA DE MEIRA 25, MADRID',
              'neighborhood': 'NUMANCIA',
              'number': 25,
              'postalCode': {
                'number': '28038',
                'verified': true
              },
              'province': 'MADRID',
              'registerNumber': 39,
              'street': 'SIERRA DE MEIRA',
              'type': 'CL',
              'zone': 'NUMANCIA # PUENTE DE VALLECAS'
            },
            'cadastre': {
              'address': 'CL SIERRA DE MEIRA 2528038 MADRID (MADRID)',
              'reference': '3625908VK4732F0001AR'
            },
            'featuredOwnerId': null,
            'floorArea': 384,
            'id': 'e4eee4b7-888e-4a5d-896e-152d2747fa96',
            'location': {
              'lat': 40.3995889,
              'lng': -3.6650086
            },
            'metadata': [
              {
                'id': 'ac49afba-75dc-4c85-9748-017aeba52ec5',
                'mimeType': 'application/pdf',
                'name': '127570.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/92dece03-edcf-407e-825f-8d5b998fb180.jpg'
              },
              {
                'id': 'dac451a5-96be-472e-b033-9bfb4725698d',
                'mimeType': 'image/jpeg',
                'name': '3625908VK4732F0001AR.jpg',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/95620bf8-dd20-4ecf-962e-5209f21ff3fe.jpg'
              },
              {
                'id': 'e49e442d-6061-4314-a8ae-ffa704422a60',
                'mimeType': 'application/pdf',
                'name': '3625908VK4732F0001AR.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/e537d2fc-121e-4bd5-bdf5-1bab833f4ba5.jpg'
              }
            ],
            'recentProposal': null,
            'use': 'Oficinas'
          }
        ],
        'relatedOwners': [
          {
            'featuredContact': null,
            'id': 'a1a3157f-31cf-4c62-99f5-d481b89d1243',
            'name': 'ACCESORIOS CONDUCCIONES SA',
            'person': {
              'contacts': [
                {
                  'id': '8b58179c-778a-4770-8aeb-2738c36c43ea',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '914333404'
                },
                {
                  'id': 'dec1fb66-3117-4d98-b28a-8bd5a363f90a',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '645840952'
                },
                {
                  'id': 'cf010c69-e6d4-46d0-b16d-d0735fa0c8bf',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '645840952'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'PRINCIPAL'
          }
        ],
        'status': 'LOOKING_MEETING'
      },
      {
        'id': '85a506a3-803b-4d00-82a4-a0dadfd11418',
        'queueId': null,
        'relatedBuildings': [
          {
            'address': {
              'city': 'MADRID',
              'fullAddress': 'CL ZURITA 22, MADRID',
              'neighborhood': 'EMBAJADORES',
              'number': 22,
              'postalCode': {
                'number': '28012',
                'verified': true
              },
              'province': 'MADRID',
              'registerNumber': 37,
              'street': 'ZURITA',
              'type': 'CL',
              'zone': 'EMBAJADORES # CENTRO'
            },
            'cadastre': {
              'address': 'CL ZURITA 2228012 MADRID (MADRID)',
              'reference': '0736903VK4703F0001TO'
            },
            'featuredOwnerId': 'a8176c5c-27eb-4cef-ad7c-5cbc3805726d',
            'floorArea': 441,
            'id': 'd4e74a49-8bf3-4ae3-bb58-c6bf069f3103',
            'location': {
              'lat': 40.4095582,
              'lng': -3.6993532
            },
            'metadata': [
              {
                'id': 'c09b2ff4-870f-4309-b140-51ff47eddbfc',
                'mimeType': 'application/pdf',
                'name': '132273.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/96a53360-68ff-4301-960c-e34b71a94998.jpg'
              },
              {
                'id': '55e05705-4c34-4351-a438-e71080fe10e1',
                'mimeType': 'image/jpeg',
                'name': '0736903VK4703F0001TO.jpg',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/a2ef8d32-6ae6-44cb-8acd-e3c13f7e972d.jpg'
              },
              {
                'id': '05d53506-9e5f-4f62-9837-0499e3741b83',
                'mimeType': 'application/pdf',
                'name': '0736903VK4703F0001TO.pdf',
                'previewUrl': 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/fc769d05-f54e-4e25-b3ac-aa31bd183869.jpg'
              }
            ],
            'recentProposal': {
              '_documentType': 'building-proposal',
              'accepted': false,
              'aspiration': -1,
              'buildingId': 'd4e74a49-8bf3-4ae3-bb58-c6bf069f3103',
              'createdAt': '2019-10-04T08:20:30.007Z',
              'createdBy': '183d8c24-98a5-4f0b-bcd0-b14f2ffca457',
              'id': '58b3ddab-09a1-43b9-b0e5-234f9f7cd014',
              'ownerId': 'a8176c5c-27eb-4cef-ad7c-5cbc3805726d',
              'proposal': 750000,
              'state': 'pendiente',
              'updateBy': null,
              'updatedAt': null
            },
            'use': 'Residencial'
          }
        ],
        'relatedOwners': [
          {
            'featuredContact': null,
            'id': '3fe84307-3a26-4acc-a1f9-b2cc12ed2790',
            'name': 'HERRERO FUENTES ANA ISABEL',
            'person': {
              'contacts': [
                {
                  'id': '78a11eaa-885a-4eda-b682-51b43cc6cace',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '913070121'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'SECUNDARIO'
          },
          {
            'featuredContact': null,
            'id': '54cb3f28-a104-4d93-8cfa-a6bf4f77b50c',
            'name': 'SILVIA HERRERO FUENTES',
            'person': {
              'contacts': [
                {
                  'id': 'a95852c4-08d0-40a5-a8d4-7c10766541ee',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '915461237'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'FAMILIAR'
          },
          {
            'featuredContact': null,
            'id': '766fca67-6eec-453a-a2c5-7acc7c263d6d',
            'name': 'HERRERO FUENTES ANA ISABEL',
            'person': {
              'contacts': [
                {
                  'id': '78a11eaa-885a-4eda-b682-51b43cc6cace',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '913070121'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'SECUNDARIO'
          },
          {
            'featuredContact': null,
            'id': '9b00f186-bd36-4d17-af8e-a86939177ad5',
            'name': 'PABLO CRIADO',
            'person': {
              'contacts': [
                {
                  'id': 'afb6a451-614a-4652-b6c2-7d804accf8d2',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'MOVIL',
                  'value': '620418383'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'NINGUNO'
          },
          {
            'featuredContact': null,
            'id': 'a8176c5c-27eb-4cef-ad7c-5cbc3805726d',
            'name': 'HERRERO FUENTES ANA',
            'person': {
              'contacts': [
                {
                  'id': '65ed85c1-93c1-478e-bc62-aca107b23aa4',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '645823380'
                },
                {
                  'id': '3b1684aa-b0a9-4357-86e4-21b61f9ca12b',
                  'note': null,
                  'status': 'UNDEFINED',
                  'type': 'TELEFONO',
                  'value': '913070121'
                },
                {
                  'id': '0587bb25-0369-47e2-a940-329550df8382',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'EMAIL',
                  'value': 'aherrerofu@gmail.com'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'HERMANOS'
          },
          {
            'featuredContact': null,
            'id': 'c4ec0c7e-2ee8-4d4e-a1b0-7d80ddd7869c',
            'name': 'FUENTES MANSO MARIA ENCARNACION',
            'person': {
              'contacts': [
                {
                  'id': '5dbe803c-c1d3-4373-a225-23a2a1d1e2f7',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '914201779'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'FAMILIAR'
          },
          {
            'featuredContact': null,
            'id': 'd7e62802-8012-462d-b665-8579c99ac781',
            'name': 'HERRERO FUENTES ANA ISABEL',
            'person': {
              'contacts': [
                {
                  'id': '78a11eaa-885a-4eda-b682-51b43cc6cace',
                  'note': '',
                  'status': 'GOOD',
                  'type': 'TELEFONO',
                  'value': '913070121'
                }
              ]
            },
            'status': 'VERIFICADO',
            'type': 'SECUNDARIO'
          }
        ],
        'status': 'LOOKING_MEETING'
      }
    ], t.list(CallcenterView))
  })
})
