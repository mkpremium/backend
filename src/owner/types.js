/* eslint-disable max-len */
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import _flatten from 'lodash/flatten'
import { isTest } from '../../config'

/**
 * @swagger
 * definitions:
 *   OwnerCompactViewPerson:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *         description: Id de la persona
 *       name:
 *         type: string
 *         description: Nombre de la persona
 *   OwnerCompactView:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *         description: Id del propietario
 *       person:
 *         $ref: "#/definitions/OwnerCompactViewPerson"
 *       contact:
 *         $ref: "#/definitions/TypedContactInfo"
 *       buildingId:
 *         type: string
 *         format: uuid/v4
 *       type:
 *         type: string
 *       verified:
 *         type: boolean
 *       status:
 *         type: string
 *         enum: [NO_VERIFICADO, VERIFICADO, ERRONEO]
 */
t.OwnerCompactView = t.struct(
  {
    id: t.String,
    type: t.OwnerType,
    status: t.OwnerStatus,
    business: t.maybe(t.OwnerBusiness),
    buildingId: isTest() ? t.maybe(t.String) : t.String,
    confirmedByOperator: t.OwnerConfirmed,
    person: t.struct({
      id: t.String,
      name: t.String
    }, 'person'),
    contact: t.TypedContactInfo
  },
  {
    name: 'OwnerView',
    defaultProps: {
      confirmedByOperator: {
        value: false
      }
    }
  }
)

/**
 * @swagger
 * definitions:
 *   OwnerUpdateBusinessStatus:
 *     properties:
 *       status:
 *         type: string
 *         enum: [PENDIENTE, PROPUESTA RECHAZADA, PROPUESTA ENVIADA, PRE-CIERRE, COMPRADO, VENDIDO, NO VENDE, DESCARTADO]
 */
t.OwnerUpdateBusinessStatus = t.struct({
  status: t.OwnerBusinessStatus
}, 'OwnerUpdateBusinessStatus')

/**
 * @swagger
 * definitions:
 *   OwnerLitResponse:
 *     required:
 *       - results
 *     properties:
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/OwnerWithInclude"
 */
t.OwnerLitResponse = t.struct(
  {
    results: t.list(t.OwnerWithInclude)
  },
  {
    name: 'OwnerLitResponse',
    defaultProps: {
      results: []
    }
  }
)

export const OwnerListQuery = t.OwnerListQuery = t.ListQuery.extend(
  {
    contactNumber: t.maybe(t.String)
  },
  {
    name: 'OwnerListQuery',
    defaultProps: {
    }
  }
)

export function ownersContactViews (owners, worksheet) {
  function mapOwner (owner) {
    return ownerContactsView(owner, worksheet.relatedBuildings[0])
  }

  return _flatten(owners.map(mapOwner))
}

export function ownerContactsView (owner, building) {
  return owner.person.contacts
    .map((contact) => fromJSON(Object.assign({}, owner, {
      person: owner.person,
      contact
    }), t.OwnerCompactView))
}

export default t
