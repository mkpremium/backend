var t = require('tcomb');
var modelHelper = require('./models-helper');

//
// BankOperation
// =================================================================
var BankOperationDTO = t.struct({
    _documentType: t.Str,
    id: t.maybe(t.Str),
    operationId: t.maybe(t.Str),
    operation: t.maybe(t.Str),
    timestamp: t.maybe(t.Number),
    buildings: t.maybe(t.Arr),
    processed: t.maybe(t.Boolean)
}, { defaultProps: { _documentType: 'bankOperation' } });

var BankOperationInputDTO = t.struct({
    operationid: t.maybe(t.Str),
    operation: t.maybe(t.Str),
    timestamp: t.maybe(t.Number),
    buildings: t.maybe(t.Arr),
    processed: t.maybe(t.Boolean)
});

BankOperationInputDTO.prototype.toDatabase = function () {
    let data = JSON.parse(JSON.stringify(this));
    data = modelHelper.removeNulls(data);

    // manual bindings
    let manual = {
        _documentType: 'bankOperation',
        id: data.operationid,
        operationId: data.operationid,
        operation: data.operation,
        timestamp: data.timestamp,
        buildings: data.buildings,
        processed: data.processed
    };

    // mutable
    let bankOperationDTO = JSON.parse(JSON.stringify(new BankOperationDTO(manual)));

    return bankOperationDTO;
};

module.exports.BankOperationInputDTO = BankOperationInputDTO;
module.exports.BankOperationDTO = BankOperationDTO;