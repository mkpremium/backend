import t from 'tcomb';
import _flatten from 'lodash/flatten';
import {isTest} from '../../config';

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
 *         type: bool
 *       status:
 *         type: string
 *         enum: [NO_VERIFICADO, VERIFICADO, ERRONEO]
 */
t.OwnerCompactView = t.struct(
  {
    id: t.String,
    type: t.OwnerType,
    status: t.OwnerStatus,
    buildingId: isTest() ? t.maybe(t.String) : t.String,
    confirmedByOperator: t.OwnerConfirmed,
    person: t.struct({
      id: t.String,
      name: t.String
    }, 'person'),
    contact: t.TypedContactInfo
  },
  {
    name: 'OwnerView'
  }
);

export function ownersContactViews(owners) {
  return _flatten(owners.map(ownerContactsView));
}

export function ownerContactsView(owner) {
  return owner.person.contacts
    .map((contact) => t.OwnerCompactView(Object.assign({}, owner, {
      person: owner.person,
      contact
    })));
}

export default t;
