var t = require('tcomb');
var modelHelper = require('./models-helper');

//
// BankBuilding
// =================================================================
var BankBuildingDTO = t.struct({
    _documentType: t.Str,
    id: t.maybe(t.Str),
    buildingId: t.maybe(t.Str),
    sociedad: t.maybe(t.Str),
    activo	: t.maybe(t.Number),
    municipio: t.maybe(t.Str),
    provincia: t.maybe(t.Str),
    comunidad : t.maybe(t.Str),
    sup_construida: t.maybe(t.Number),
    portal	: t.maybe(t.String),
    piso	: t.maybe(t.Str),
    escalera	: t.maybe(t.Str),
    puerta: t.maybe(t.Str),
    barria : t.maybe(t.Str),
    domicilio : t.maybe(t.Str),
    cp	: t.maybe(t.Number),
    tipo1	: t.maybe(t.Str),
    tipo2	: t.maybe(t.Str),
    precio_web	: t.maybe(t.Number),
    cituacion	: t.maybe(t.Str),
    catastro	: t.maybe(t.Str),
    fr	: t.maybe(t.Str),
    workflow: t.maybe(t.Obj),
    processTimestamp: t.maybe(t.Boolean),
    priceMetersZone: t.maybe(t.Number),
    priceMetersLocation: t.maybe(t.Number),
    priceZone: t.maybe(t.Number),
    priceLocation: t.maybe(t.Number),
    priceBuy: t.maybe(t.Number),
    priceSell: t.maybe(t.Number),
    latitude: t.maybe(t.Boolean),
    longitude: t.maybe(t.Boolean),
    processed: t.maybe(t.Boolean),
    available: t.maybe(t.Boolean)
}, { defaultProps: { _documentType: 'bankBuilding' } });

var BankBuildingInputDTO = t.struct({
    id: t.maybe(t.Str),
    buildingid: t.maybe(t.Str),
    sociedad: t.maybe(t.Str),
    activo: t.maybe(t.Number),
    municipio: t.maybe(t.Str),
    provincia: t.maybe(t.Str),
    comunidad: t.maybe(t.Str),
    sup_construida: t.maybe(t.Number),
    portal: t.maybe(t.String),
    piso: t.maybe(t.Str),
    escalera: t.maybe(t.Str),
    puerta: t.maybe(t.Str),
    barria: t.maybe(t.Str),
    domicilio : t.maybe(t.Str),
    cp: t.maybe(t.Number),
    tipo1: t.maybe(t.Str),
    tipo2: t.maybe(t.Str),
    precio_web: t.maybe(t.Number),
    cituacion: t.maybe(t.Str),
    catastro: t.maybe(t.Str),
    fr: t.maybe(t.Str),
    workflow: t.maybe(t.Obj),
    processtimestamp: t.maybe(t.Boolean),
    pricemeterszone: t.maybe(t.Number),
    pricemeterslocation: t.maybe(t.Number),
    pricezone: t.maybe(t.Number),
    pricelocation: t.maybe(t.Number),
    pricebuy: t.maybe(t.Number),
    pricesell: t.maybe(t.Number),
    latitude: t.maybe(t.Boolean),
    longitude: t.maybe(t.Boolean),
    processed: t.maybe(t.Boolean),
    available: t.maybe(t.Boolean)
});

BankBuildingDTO.NUMBER_FIELDS = ['activo', 'sup_construida', 'cp', 'precio_web'];

BankBuildingInputDTO.prototype.toDatabase = function () {
    let data = JSON.parse(JSON.stringify(this));
    data = modelHelper.removeNulls(data);

    // manual bindings
    let manual = {
        _documentType: 'bankBuilding',
        id: data.id,
        buildingId: data.buildingid,
        sociedad: data.sociedad,
        activo: data.activo,
        municipio: data.municipio,
        provincia: data.provincia,
        comunidad: data.comunidad,
        sup_construida: data.sup_construida,
        portal: data.portal,
        piso: data.piso,
        escalera: data.escalera,
        puerta: data.puerta,
        barria: data.barria,
        domicilio: data.domicilio,
        cp: data.cp,
        tipo1: data.tipo1,
        tipo2: data.tipo2,
        precio_web: data.precio_web,
        cituacion: data.cituacion,
        catastro: data.catastro,
        fr: data.fr,
        workflow: data.workflow,
        processTimestamp: data.processtimestamp,
        priceMetersZone: data.pricemeterszone,
        priceMetersLocation: data.pricemeterslocation,
        priceZone: data.pricezone,
        priceLocation: data.pricelocation,
        priceBuy: data.pricebuy,
        priceSell: data.pricesell,
        latitude: data.latitude,
        longitude: data.longitude,
        processed: data.processed,
        available: data.available
    };

    // mutable
    let bankBuildingDTO = JSON.parse(JSON.stringify(new BankBuildingDTO(manual)));

    return bankBuildingDTO;
};

module.exports.BankBuildingInputDTO = BankBuildingInputDTO;
module.exports.BankBuildingDTO = BankBuildingDTO;