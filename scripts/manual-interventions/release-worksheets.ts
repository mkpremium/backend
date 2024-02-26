import { createDiContainer } from '../../src/infrastructure/dependencies'
import {
  ReleaseUserExtraOpenedWorksheetsInQueueService
} from '../../src/worksheet/service/release-user-extra-opened-worksheets-in-queue.service'

const pairs = [
  {
    'userId': 'becb44bd-6c69-4c82-84ea-1f436e93011f',
    'queueId': '1bf1427c-0e23-4084-a11c-2e459b95d0e7'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': '8709091c-9e30-4bee-8821-5e350d233ca4'
  },
  {
    'userId': '27e2c4d8-ba75-476e-bbbd-70372b3dee9b',
    'queueId': 'f365e947-4c0e-4beb-ba18-25db1773587f'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': '314ff202-cad8-4ef5-9ff0-ffde98940a77'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': '1d2ed048-137a-4e63-8ce1-ec785dc6497e'
  },
  {
    'userId': '56ecc194-b998-43b5-a118-62e40b69aa84',
    'queueId': '2159c484-82dc-48f9-ab08-a8cdf789df68'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': '14c57846-2458-4f9d-bd8c-d9c1898f2172'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': '1bf1427c-0e23-4084-a11c-2e459b95d0e7'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': 'baf2f57f-78eb-4bc8-8056-26f2314a1320'
  },
  {
    'userId': '7f3a99b5-6e4b-4ac1-8f6e-a63ebcd9a988',
    'queueId': 'f365e947-4c0e-4beb-ba18-25db1773587f'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': '2159c484-82dc-48f9-ab08-a8cdf789df68'
  },
  {
    'userId': 'becb44bd-6c69-4c82-84ea-1f436e93011f',
    'queueId': null
  },
  {
    'userId': '19b49e72-eb3f-443d-b431-401836675ddf',
    'queueId': '1bf1427c-0e23-4084-a11c-2e459b95d0e7'
  },
  {
    'userId': '56ecc194-b998-43b5-a118-62e40b69aa84',
    'queueId': '14c57846-2458-4f9d-bd8c-d9c1898f2172'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': 'cde0cd3d-68c5-4711-b37c-37d314b4824b'
  },
  {
    'userId': 'a5be747d-09c8-47dd-96f3-32734dd41878',
    'queueId': '825c71f0-3071-4842-8367-6d9298a86a02'
  },
  {
    'userId': '27e2c4d8-ba75-476e-bbbd-70372b3dee9b',
    'queueId': 'e1748e7d-8714-45c0-a831-c0f42d6d564f'
  },
  {
    'userId': 'd79d3df6-9fd6-4820-a0b4-3689d5a1719d',
    'queueId': '1bf1427c-0e23-4084-a11c-2e459b95d0e7'
  }
]
createDiContainer()
  .then(async container => {
    const service = new ReleaseUserExtraOpenedWorksheetsInQueueService(
      0,
      container.resolve('logger'),
      container.resolve('entityManager')
    )

    for (const pair of pairs) {
      await service.release(pair.userId, pair.queueId)
    }
  })
