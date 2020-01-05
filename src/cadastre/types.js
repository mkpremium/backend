import * as tcomb from 'tcomb'
import { streetTypes } from './constants'

export const CadastreCache = tcomb.struct(
  {
    id: tcomb.String,
    value: tcomb.Any,
    _documentType: tcomb.enums.of(['cadastre-cache'])
  },
  {
    name: 'CadastreCache',
    defaultProps: {
      _documentType: 'cadastre-cache'
    }
  }
)

export const CadastreStreetType = tcomb.enums.of(Object.keys(streetTypes))

/**
 * @swagger
 * definitions:
 *   CadastreStreet:
 *     properties:
 *       type:
 *         type: string
 *         description: Tipo de via
 *       name:
 *         type: string
 *         description: Nombre de la via
 */
export const CadastreStreet = tcomb.struct(
  {
    type: CadastreStreetType,
    name: tcomb.String
  },
  {
    name: 'CadastreStreet'
  }
)

/**
 * @swagger
 * definitions:
 *   CadastreAddressInput:
 *     properties:
 *       province:
 *         type: string
 *       city:
 *         type: string
 *       street:
 *         $ref: "#/definitions/CadastreStreet"
 *         description: "Puede un elemento obtenido del endpoint de cadastre/streets"
 *       number:
 *         type: string
 *   CadastreAddress:
 *     properties:
 *       location:
 *         $ref: "#/definitions/Location"
 *       address:
 *         $ref: "#/definitions/Address"
 *   CadastreReferenceInput:
 *     properties:
 *       cadastreReference:
 *         type: string
 *
 */
export const CadastreAddressInput = tcomb.struct(
  {
    province: tcomb.String,
    city: tcomb.String,
    street: CadastreStreet,
    number: tcomb.String
  },
  {
    name: 'NormalizedAddress'
  }
)
export const CitiesInput = tcomb.struct({
  province: tcomb.String
}, 'CitiesInput')

export const StreetsInput = tcomb.struct({
  province: tcomb.String,
  city: tcomb.String
}, 'StreetsInput')
