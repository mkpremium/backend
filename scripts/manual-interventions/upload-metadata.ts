import { uploadFile } from '../../src/aws'

uploadFile('metadata-migration', process.argv[2])
  .then(result => {
    console.log('result', result)
    process.exit()
  })
  .catch(error => {
    throw error
  })
