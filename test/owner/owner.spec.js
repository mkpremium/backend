
import {OwnerRepository} from '../../src/owner/models';
import {expect} from 'chai';
import {deleteAll} from '../common';
describe('Owner repository test', () => {
  let ownersMock = [
    {
      id: 'Im a verified owner',
      person: {
        contacts: [
          {status: 'GOOD'}
        ]
      }
    },
    {
      id: 'Im not a verified owner :(',
      person: {
        contacts: [
          {status: 'BAAD'}
        ]
      }
    }
  ];
  before(async() => {

  });

  let owner = {
    person: {
      contacts : [
        {
          status: 'GOOD'
        },
        {
          status : 'BAAD'
        }
      ]
    }
  };

  it('Owner should be verified', async() =>{
    const ownerRepository = new OwnerRepository();
    const actual = ownerRepository.isOwnerVerified(owner);
    expect(actual).to.be.true;
  });

  it('Should return if owner is verified or not', async() => {
    const ownerRepository = new OwnerRepository();
    const verifiedOwners = ownerRepository.getVerifiedOwners(ownersMock);
    expect(verifiedOwners.length).to.equal(1);
    expect(verifiedOwners[0].id).to.equal('Im a verified owner');
  });
});
