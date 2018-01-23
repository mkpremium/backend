var t = require('tcomb');
var modelHelper = require('./models-helper');

// =================================================================
// HouseState
// =================================================================
var HouseStateDTO = t.struct({
    _documentType: t.Str,
    id              : t.Str,

    folderId	    : t.maybe(t.Str),
    catastroId		: t.maybe(t.Str),
    houseStateId    : t.maybe(t.Str),    
    address		    : t.maybe(t.Str),
    limitDate    	: t.maybe(t.Str), // Date
    rent	        : t.maybe(t.Number),
    surfaceM2		: t.maybe(t.Number),
    price  		    : t.maybe(t.Number),
    tmstmp		    : t.maybe(t.Str),
    order		    : t.maybe(t.Number),
    closed          : t.maybe(t.Boolean),
    notes		    : t.maybe(t.Str),
    keys		    : t.maybe(t.Boolean),
    keysOccuped		: t.maybe(t.Boolean),
    entityType		: t.maybe(t.Str),
    alarmCode		: t.maybe(t.Str),
    tenantName	    : t.maybe(t.Str),
    compensation	: t.maybe(t.Number),
    roofSurfaceM2	: t.maybe(t.Number),


}, { defaultProps: { _documentType: 'housestate' } });

// =================================================================
// HouseStateInput
// =================================================================
var HouseStateInputDTO = t.struct({
    id_statoedificioentita	: t.Str,
    id_statoedificio		: t.Str,
    id_catastro	        	: t.Str,
    id_situazione   		: t.maybe(t.Str),
    entita		            : t.maybe(t.Str),
    data_limite     		: t.maybe(t.Str),
    mensile	            	: t.maybe(t.Str),
    m2		                : t.maybe(t.Str),
    prezzo_vendita  		: t.maybe(t.Str),
    tmstmp		            : t.maybe(t.Str),
    ordine		            : t.maybe(t.Str),
    sigillato               : t.maybe(t.Str),
    note		            : t.maybe(t.Str),
    chiave		            : t.maybe(t.Str),
    chiaveoccupante		    : t.maybe(t.Str),
    tipoentita		        : t.maybe(t.Str),
    codiceallarme		    : t.maybe(t.Str),
    inquilino	            : t.maybe(t.Str),
    richiestauscita		    : t.maybe(t.Str),
    m2t		                : t.maybe(t.Str),

    
});



HouseStateInputDTO.prototype.toDatabase = function () {

    let data = JSON.parse(JSON.stringify(this));
    data = modelHelper.removeNulls(data);

    // manual bindings
    let manual = {
        _documentType: 'housestate',
        id: data.id_statoedificioentita,

        folderId	    : data.id_statoedificio,
        catastroId	    : data.id_catastro,
        houseStateId    : data.id_situazione,
        address		    : data.entita,
        limitDate    	: data.data_limite,
        rent	        : data.mensile !== null ? parseFloat(data.mensile) : undefined,
        surfaceM2		: data.m2 !== null ? parseFloat(data.m2) : undefined,
        soldPrice  		: data.prezzo_vendita !== null ? parseFloat(data.prezzo_vendita) : undefined,
        tmstmp		    : data.tmstmp,
        order		    : data.ordine !== null ? parseInt(data.ordine) : undefined,
        closed          : data.sigillato !== null ? data.sigillato == '1' : false,
        notes		    : data.note,
        keys		    : data.chiave !== null ? data.chiave == '1' : false,
        keysOccuped		: data.chiaveoccupante !== null ? data.chiaveoccupante == '1' : false,
        entityType		: data.tipoentita,
        alarmCode		: data.codiceallarme,
        tenantName	    : data.inquilino,
        compensation	: data.richiestauscita !== null ? parseFloat(data.richiestauscita) : undefined,
        roofSurfaceM2	: data.m2t !== null ? parseFloat(data.m2t) : undefined, 
    };

    manual = modelHelper.removeNulls(manual);

    // mutable 
    let dataDTO = JSON.parse(JSON.stringify(new HouseStateDTO(manual)));

    return dataDTO;
};

module.exports.HouseStateInputDTO = HouseStateInputDTO;
module.exports.HouseStateDTO      = HouseStateDTO;