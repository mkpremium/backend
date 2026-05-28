import { expect } from 'chai'
import { addOwnerCommandMapper } from '../../../../src/call/service/mappers/add-owner-command.mapper'

console.log('TEST FILE LOADED')

describe('addOwnerCommandMapper', () => {
  it('should map basic data correctly', () => {
    const body = {
      args: {
        name: 'Juan',
        surname: 'Perez',
        phone: '600000000'
      }
    }

    const result = addOwnerCommandMapper(body as any)

    expect(result).to.have.property('person')
    expect(result.person.firstName).to.equal('Juan')
    expect(result.person.firstSurname).to.equal('Perez')

    expect(result.person.contacts).to.be.an('array')
    expect(result.person.contacts[0].value).to.equal('600000000')
  })

  it('should handle missing surname', () => {
    const body = {
      args: {
        name: 'Juan',
        phone: '600000000'
      }
    }

    const result = addOwnerCommandMapper(body as any)

    expect(result.person.firstName).to.equal('Juan')
    expect(result.person.firstSurname).to.be.undefined
  })

  it('should handle missing name', () => {
    const body = {
      args: {
        surname: 'Perez',
        phone: '600000000'
      }
    }

    const result = addOwnerCommandMapper(body as any)

    expect(result.person.firstName).to.be.undefined
    expect(result.person.firstSurname).to.equal('Perez')
  })

  it('should create empty contacts if phone is missing', () => {
    const body = {
      args: {
        name: 'Juan',
        surname: 'Perez'
      }
    }

    const result = addOwnerCommandMapper(body as any)

    expect(result.person.contacts).to.be.an('array')
    expect(result.person.contacts.length).to.equal(0)
  })

  it('should trim spaces in name and surname', () => {
    const body = {
      args: {
        name: '  Juan  ',
        surname: '  Perez  ',
        phone: '600000000'
      }
    }

    const result = addOwnerCommandMapper(body as any)

    expect(result.person.firstName).to.equal('Juan')
    expect(result.person.firstSurname).to.equal('Perez')
  })

  it('should build full name correctly', () => {
    const body = {
      args: {
        name: 'Juan',
        surname: 'Perez'
      }
    }

    const result = addOwnerCommandMapper(body as any)

    expect(result.person.name).to.equal('Juan Perez')
  })
})
