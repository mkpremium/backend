var t = require('tcomb');
var modelHelper = require('./models-helper');

//
// Bank
// =================================================================
var BankDTO = t.struct({
    _documentType: t.Str,
    id: t.maybe(t.Str),
    ticketId: t.maybe(t.Str),
    userId: t.maybe(t.Str),
    timestamp: t.maybe(t.Number),
    buildings: t.maybe(t.Arr)
}, { defaultProps: { _documentType: 'tempBankUpdate' } });

var BankInputDTO = t.struct({
    ticketid: t.maybe(t.Str),
    userid: t.maybe(t.Str),
    timestamp: t.maybe(t.Number),
    buildings: t.maybe(t.Arr)
});

BankDTO.BANK_FIELDS = ['SOCIEDAD', 'ACTIVO', 'MUNICIPIO', 'PROVINCIA', 'COMUNIDAD', 'Sup_Construida', 'PORTAL', 'PISO', 'ESCALERA', 'PUERTA', 'BARRIO', 'DOMICILIO', 'CP', 'TIPO1', 'TIPO2', 'PRECIO WEB', 'SITUACION', 'CATASTRO', 'FR'];

BankInputDTO.prototype.toDatabase = function () {
    let data = JSON.parse(JSON.stringify(this));
    data = modelHelper.removeNulls(data);

    // manual bindings
    let manual = {
        _documentType: 'tempBankUpdate',
        id: data.ticketid,
        ticketId: data.ticketid,
        userId: data.userid,
        timestamp: data.timestamp,
        buildings: data.buildings
    };

    // mutable
    let bankDTO = JSON.parse(JSON.stringify(new BankDTO(manual)));

    return bankDTO;
};

module.exports.BankInputDTO = BankInputDTO;
module.exports.BankDTO = BankDTO;