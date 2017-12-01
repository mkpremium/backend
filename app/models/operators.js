var t = require('tcomb');
var modelHelper = require('./models-helper');

// =================================================================
// Operator
// =================================================================
var OperatorDTO = t.struct({
    _documentType: t.Str,
    id: t.Str,
    name: t.maybe(t.Str),
    surname	: t.maybe(t.Str),
    userName: t.maybe(t.Str),
    password: t.maybe(t.Str),
    operatorNumber : t.maybe(t.Str),
    ip: t.maybe(t.Str),
    level	: t.maybe(t.Number),
    blocked	: t.maybe(t.Boolean),
    superUser	: t.maybe(t.Boolean),
    timestamp: t.maybe(t.Str),
    creationDate : t.maybe(t.Date),
    deletionDate : t.maybe(t.Date),
    city	: t.maybe(t.Str),

}, { defaultProps: { _documentType: 'operator' } });

// =================================================================
// OperatorInput
// =================================================================
var OperatorInputDTO = t.struct({
    id_operatore: t.Str,
    nome: t.maybe(t.Str),
    cognome	: t.maybe(t.Str),
    username: t.maybe(t.Str),
    password: t.maybe(t.Str),
    numeroagente	: t.maybe(t.Str),
    ipcorrente: t.maybe(t.Str),
    numerolivello	: t.maybe(t.Str),
    bloccato	: t.maybe(t.Str),
    superuser	: t.maybe(t.Str),
    tmstmp: t.maybe(t.Str),
    datainizio	: t.maybe(t.Str),
    datafine	: t.maybe(t.Str),
    citta	: t.maybe(t.Str),
});



OperatorInputDTO.prototype.toDatabase = function () {
    
    //console.log('this', JSON.stringify(this));

    // manual bindings
    let manual = {
        _documentType: 'operator',
        id: this.id_operatore,
        name: this.nome,
        username: this.username,
        password: this.password,
        operatorNumber: this.numeroagente,
        ip: this.ipcorrente,
        level: typeof this.numerolivello !== "undefined" ? parseInt(this.numerolivello) : undefined,
        blocked: typeof this.bloccato !== "undefined" ? this.bloccato == '1' : false,
        superUser: typeof this.superuser !== "undefined" ? this.superuser == '1' : false,
        timestamp: this.tmstmp,
        creationDate: this.datainizio !== "NULL" ? this.datainizio : null,
        deletionDate: this.datafine !== "NULL" ? this.datafine : null,
        city: this.citta,
    };

    manual = modelHelper.removeNulls(manual);

    // mutable OperatorDTO
    let operatorDTO = JSON.parse(JSON.stringify(new OperatorDTO(manual)));

    return operatorDTO;
};

module.exports.OperatorInputDTO = OperatorInputDTO;
module.exports.OperatorDTO = OperatorDTO;