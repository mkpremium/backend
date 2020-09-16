import { expect } from 'chai'
import { GetDocumentsSignedURLService } from '../../../src/building/service/GetDocumentsSignedURLService'
import { stub } from 'sinon'

describe('GetDocumentsSignedURLService', () => {
  const testSignedURL = 'https://bucket.s3.aws.com/document/path?signature'
  const testDocumentPathWithoutInitialSlash = 'document/path'
  const testDocumentPrivateURL = 'https://bucket.s3.aws.com/' + testDocumentPathWithoutInitialSlash
  const testDocumentId = 'test-document-id'
  const testBuildingDocuments = [
    {
      documentId: testDocumentId,
      privateUrl: testDocumentPrivateURL
    }
  ]
  const testBuildingId = 'test-building-id'
  const testDocumentBucket = 'test-bucket'

  let service
  let s3ClientMock
  let buildingDocumentsRepositoryMock

  beforeEach(() => {
    s3ClientMock = {
      getSignedUrlPromise: stub()
    }
    buildingDocumentsRepositoryMock = {
      documentsOfBuilding: stub()
    }
    service = new GetDocumentsSignedURLService(
      buildingDocumentsRepositoryMock,
      s3ClientMock,
      testDocumentBucket
    )
  })

  it('returns signed URL', async () => {
    buildingDocumentsRepositoryMock.documentsOfBuilding.withArgs(testBuildingId).resolves(testBuildingDocuments)
    s3ClientMock.getSignedUrlPromise.withArgs('getObject', {
      Bucket: testDocumentBucket,
      Key: testDocumentPathWithoutInitialSlash
    }).resolves(testSignedURL)

    const signedURLs = await service.getDocumentsSignedURL(testBuildingId)

    expect(signedURLs).to.deep.equal([ {
      url: testSignedURL,
      documentId: testDocumentId
    } ])
  })
})
