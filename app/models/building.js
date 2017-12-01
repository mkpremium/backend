var t = require('tcomb');
var modelHelper = require('./models-helper');

// =================================================================
// BUILDING
// =================================================================
var BuildingDTO = t.struct({
    _documentType: t.Str,
    id: t.Str,
    type: t.maybe(t.Str),
    street: t.maybe(t.Str),
    number: t.maybe(t.Str),
    fullStreet: t.maybe(t.Str),
    numbero: t.maybe(t.Str),
    postalCode: t.maybe(t.Str),
    build: t.maybe(t.Str),
    reference: t.maybe(t.Str),
    location: t.maybe(t.Str),
    postalCode2: t.maybe(t.Str),
    class: t.maybe(t.Str),
    surfaceBuilded: t.maybe(t.Str),
    surfaceTerrain: t.maybe(t.Str),
    coefficent: t.maybe(t.Str),
    use: t.maybe(t.Str),
    propertyType: t.maybe(t.Str),
    yearConstruction: t.maybe(t.Str),
    owner: t.maybe(t.Str),
    phone: t.maybe(t.Str),
    elementsNumber: t.maybe(t.Str),
    elementsAverage: t.maybe(t.Str),
    commonsElements: t.maybe(t.Str),
    municipality: t.maybe(t.Str),
    province: t.maybe(t.Str),
    ownerName: t.maybe(t.Str),
    ownerStreet: t.maybe(t.Str),
    ownerCity: t.maybe(t.Str),
    numberPB: t.maybe(t.Str),
    numberIB: t.maybe(t.Str),
    numberBD: t.maybe(t.Str),
    numberABC: t.maybe(t.Str),
    number1: t.maybe(t.Str),
    number2: t.maybe(t.Str),
    number3: t.maybe(t.Str),
    surfaceRoof: t.maybe(t.Str),
    filter: t.maybe(t.Str),

}, { defaultProps: { _documentType: 'building' } });

// =================================================================
// BuildingInput
// =================================================================
var BuildingInputDTO = t.struct({
    id: t.Str,
    type: t.maybe(t.Str),
    street: t.maybe(t.Str),
    number: t.maybe(t.Str),
    carrer: t.maybe(t.Str),
    numbero: t.maybe(t.Str),
    postcode: t.maybe(t.Str),
    build: t.maybe(t.Str),
    reference: t.maybe(t.Str),
    location: t.maybe(t.Str),
    postcode2: t.maybe(t.Str),
    classe: t.maybe(t.Str),
    surfacebuilded: t.maybe(t.Str),
    surfaceterrain: t.maybe(t.Str),
    coefficent: t.maybe(t.Str),
    use: t.maybe(t.Str),
    propertytype: t.maybe(t.Str),
    yearconstruction: t.maybe(t.Str),
    owner: t.maybe(t.Str),
    phone: t.maybe(t.Str),
    elementsnumber: t.maybe(t.Str),
    elementsaverage: t.maybe(t.Str),
    commonselements: t.maybe(t.Str),
    municipality: t.maybe(t.Str),
    province: t.maybe(t.Str),
    proprietari: t.maybe(t.Str),
    domicili: t.maybe(t.Str),
    poblacio: t.maybe(t.Str),
    numero_pb: t.maybe(t.Str),
    numero_ib: t.maybe(t.Str),
    numero_bd: t.maybe(t.Str),
    numero_abc: t.maybe(t.Str),
    numero_1: t.maybe(t.Str),
    numero_2: t.maybe(t.Str),
    numero_3: t.maybe(t.Str),
    surfaceroof: t.maybe(t.Str),
    filter: t.maybe(t.Str),

});



BuildingInputDTO.prototype.toDatabase = function () {
    
    // mutable BuildingDTO mapping
    let buildingDTO = JSON.parse(JSON.stringify(new BuildingDTO(this)));

    // manual bindings
    let manual = {
        _documentType: 'building',
        id: parseInt(this.id),
        type: this.type !== "NULL" ? this.type : null,
        fullStreet: this.carrer !== "NULL" ? this.carrer : null,
        postalCode: this.postcode !== "NULL" ? this.postcode : null,
        postalCode2: this.postcode2 !== "NULL" ? this.postcode2 : null,
        class: this.classe !== "NULL" ? this.classe : null,
        surfaceBuilded: this.surfacebuilded !== "NULL" ? this.surfacebuilded : null,
        surfaceTerrain: this.surfaceterrain !== "NULL" ? this.surfaceterrain : null,
        propertyType: this.propertyType !== "NULL" ? this.propertyType : null,
        yearConstruction: this.yearconstruction !== "NULL" ? this.yearconstruction : null,        
        elementsNumber: this.elementsnumber !== "NULL" ? this.elementsnumber : null,
        elementsAverage: this.elementsaverage !== "NULL" ? this.elementsaverage : null,
        commonsElements: this.commonselements !== "NULL" ? this.commonselements : null,
        ownerName: this.proprietari !== "NULL" ? this.proprietari : null,
        ownerStreet: this.domicili !== "NULL" ? this.domicili : null,
        ownerCity: this.poblacio !== "NULL" ? this.poblacio : null,
        numberPB: this.numero_pb !== "NULL" ? this.typnumero_pbe : null,
        numberIB: this.numero_ib !== "NULL" ? this.numero_ib : null,
        numberBD: this.numero_bb !== "NULL" ? this.numero_bb : null,
        numberABC: this.numero_abc !== "NULL" ? this.numero_abc : null,
        number1: this.numero_1 !== "NULL" ? this.numero_1 : null,
        number2: this.numero_2 !== "NULL" ? this.numero_2 : null,
        number3: this.numero_2 !== "NULL" ? this.numero_3 : null,

        surfaceRoof: this.surfaceroof,
    };

    manual = modelHelper.removeNulls(manual);

    buildingDTO = Object.assign( {}, buildingDTO, manual);

    return buildingDTO;
};

module.exports.BuildingInputDTO = BuildingInputDTO;
module.exports.BuildingDTO = BuildingDTO;