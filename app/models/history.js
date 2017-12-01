var t = require('tcomb');
var modelHelper = require('./models-helper');

// =================================================================
// History
// =================================================================
var HistoryDTO = t.struct({
    _documentType: t.Str,
    id: t.Str,

    worksheetId: t.maybe(t.Str),
    notes: t.maybe(t.Str),
    notesDate: t.maybe(t.Str),
    operatorId: t.maybe(t.Str),
    departmentId: t.maybe(t.Str),
    tmStmp: t.maybe(t.Str),
    owner: t.maybe(t.Str),
    street: t.maybe(t.Str),
    number: t.maybe(t.Str),    

}, { defaultProps: { _documentType: 'history' } });

// =================================================================
// HistoryInput
// =================================================================
var HistoryInputDTO = t.struct({
    id_notachiamatafornitore: t.Str,
    id_chiamatafornitore: t.maybe(t.Str),
    data_nota: t.maybe(t.Str),
    note: t.maybe(t.Str),
    id_operatore: t.maybe(t.Str),
    id_dipartimento: t.maybe(t.Str),
    tmstmp: t.maybe(t.Str),
    proprietari: t.maybe(t.Str),
    street: t.maybe(t.Str),
    number: t.maybe(t.Str),
});



HistoryInputDTO.prototype.toDatabase = function () {
    
    //console.log('this', JSON.stringify(this));

    let data = JSON.parse(JSON.stringify(this));
    data = modelHelper.removeNulls(data);

    // manual bindings
    let manual = {
        _documentType: 'operator',
        id: this.id_notachiamatafornitore,
        worksheetId: data.id_chiamatafornitore,
        notes: data.note,
        notesDate: data.data_nota,
        operatorId: data.id_operatore,
        departmentId: data.id_dipartimento,
        tmStmp: data.tmStmp,
        owner: data.proprietari,
        street: data.street,
        number: data.number, 

    };

    // mutable 
    let dataDTO = JSON.parse(JSON.stringify(new HistoryDTO(manual)));

    return dataDTO;
};

module.exports.HistoryInputDTO = HistoryInputDTO;
module.exports.HistoryDTO = HistoryDTO;