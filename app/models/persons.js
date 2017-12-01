var t = require('tcomb');
var modelHelper = require('./models-helper');

// =================================================================
// Person
// =================================================================
var PersonDTO = t.struct({
    _documentType: t.Str,
    id          : t.Str,
    state	: t.maybe(t.Str),
    city	: t.maybe(t.Str),
    surname1	: t.maybe(t.Str),
    surname2	: t.maybe(t.Str),
    name	    : t.maybe(t.Str),
    address     : t.maybe(t.Any),
    // tipo_via	: t.maybe(t.Str),
    // nombre_via	: t.maybe(t.Str),
    // num_via	    : t.maybe(t.Str),
    // bloque	    : t.maybe(t.Str),
    // portal	    : t.maybe(t.Str),
    // escalera	: t.maybe(t.Str),
    // piso	    : t.maybe(t.Str),
    // puerta	    : t.maybe(t.Str),
    // cod_post	: t.maybe(t.Str),
    // domicili	: t.maybe(t.Str),
    bornDate    : t.maybe(t.Any),
    // dia_naci	: t.maybe(t.Str),
    // mes_naci	: t.maybe(t.Str),
    // ano_naci	: t.maybe(t.Str),    
    nuc	        : t.maybe(t.Str),
    owner	: t.maybe(t.Str),
    
    phones      : t.maybe(t.Any),
    // telefono_pb	: t.maybe(t.Str),
    // telefono_ib	: t.maybe(t.Str),
    // telefono_db	: t.maybe(t.Str),
    // telefono_abc	: t.maybe(t.Str),
    addresses   : t.maybe(t.Any),    
    // domicili_pb	: t.maybe(t.Str),
    // domicili_ib	: t.maybe(t.Str),
    // domicili_db	: t.maybe(t.Str),
    // domicili_abc: t.maybe(t.Str),
    sex 	    : t.maybe(t.Str),

}, { defaultProps: { _documentType: 'person' } });

// =================================================================
// PersonInput
// =================================================================
var PersonInputDTO = t.struct({

    id          : t.Str,
    
    provincia	: t.maybe(t.Str),
    municipio	: t.maybe(t.Str),
    apellido_1	: t.maybe(t.Str),
    apellido_2	: t.maybe(t.Str),
    nombre	    : t.maybe(t.Str),
    tipo_via	: t.maybe(t.Str),
    nombre_via	: t.maybe(t.Str),
    num_via	    : t.maybe(t.Str),
    bloque	    : t.maybe(t.Str),
    portal	    : t.maybe(t.Str),
    escalera	: t.maybe(t.Str),
    piso	    : t.maybe(t.Str),
    puerta	    : t.maybe(t.Str),
    dia_naci	: t.maybe(t.Str),
    mes_naci	: t.maybe(t.Str),
    ano_naci	: t.maybe(t.Str),
    cod_post	: t.maybe(t.Str),
    nuc	        : t.maybe(t.Str),
    proprietari	: t.maybe(t.Str),
    domicili	: t.maybe(t.Str),
    telefono_pb	: t.maybe(t.Str),
    telefono_ib	: t.maybe(t.Str),
    telefono_db	: t.maybe(t.Str),
    telefono_abc	: t.maybe(t.Str),
    domicili_pb	: t.maybe(t.Str),
    domicili_ib	: t.maybe(t.Str),
    domicili_db	: t.maybe(t.Str),
    domicili_abc: t.maybe(t.Str),
    sexo	    : t.maybe(t.Str),
    
});



PersonInputDTO.prototype.toDatabase = function () {
    
    //console.log('this', JSON.stringify(this));

    let person = JSON.parse(JSON.stringify(this));
    person = modelHelper.removeNulls(person);

    // manual bindings
    let manual = {
        _documentType: 'person',
        id: person.id,

        surname1: person.apellido_1,
        surname2	: person.apellido_1,
        name	    : person.nombre,
        address     : {
            address: person.domicili,
            state: person.provincia,
            city: person.municipio,
            nuc: person.nuc,
            streetType: person.tipo_via,
            street: person.nombre_via,
            number: person.num_via,
            block: person.bloque,
            portal: person.portal,
            stair: person.escalera,
            floor: person.piso,
            door: person.puerta,
            postalCode: person.cod_post,
        },
        bornDate    : {
            day: person.dia_naci,
            month: person.mes_naci,
            year: person.ano_naci,
        },                
        proprietari	: person.proprietari,
        
        phones      : {
            pb: person.telefono_pb,
            ib: person.telefono_ib,
            db: person.telefono_db,
            abc: person.telefono_abc,
        },        
        addresses   : {
            pb: person.domicili_pb,
            ib: person.domicili_ib,
            db: person.domicili_db,
            abc: person.domicili_abc,
        },
        sex : person.sexo
    };

    manual = modelHelper.removeNulls(manual);

    // mutable PersonDTO
    let personDTO = JSON.parse(JSON.stringify(new PersonDTO(manual)));

    return personDTO;
};

module.exports.PersonInputDTO = PersonInputDTO;
module.exports.PersonDTO      = PersonDTO;