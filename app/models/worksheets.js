var t = require('tcomb');
var modelHelper = require('./models-helper');

// =================================================================
// WorkSheet
// =================================================================
var WorkSheetDTO = t.struct({
    _documentType: t.Str,
    id                      : t.Str,
    buildingId              : t.maybe(t.Str),    
    supplierId  	        : t.maybe(t.Str),

    lastOwner               : t.maybe(t.Any),
    currentOwner            : t.maybe(t.Any),    
    history: t.maybe(t.list(t.Any)),
    info: t.maybe(t.Any),
    

}, { defaultProps: { _documentType: 'worksheet' } });

// =================================================================
// WorkSheetInput
// =================================================================
var WorkSheetInputDTO = t.struct({

    id_chiamatafornitore	: t.Str,
    id_catastro	            : t.Str,
    id_fornitore	        : t.Str,
    cognome	                : t.maybe(t.Str),
    nome	                : t.maybe(t.Str),
    telefono	            : t.maybe(t.Str),
    cellulare	            : t.maybe(t.Str),
    id_operatorelivello1	: t.maybe(t.Str),
    data_livello1	        : t.maybe(t.Str),
    id_operatorelivello2	: t.maybe(t.Str),
    data_livello2	        : t.maybe(t.Str),
    visitare	            : t.maybe(t.Str),
    data_visita	            : t.maybe(t.Str),
    ora_visita	            : t.maybe(t.Str),
    richiamare	            : t.maybe(t.Str),
    data_richiamo	        : t.maybe(t.Str),
    ora_richiamo	        : t.maybe(t.Str),
    verificato	            : t.maybe(t.Str),
    errore	                : t.maybe(t.Str),
    tmstmp	                : t.maybe(t.Str),
    vende	                : t.maybe(t.Str),
    novende	                : t.maybe(t.Str),
    id_errore	            : t.maybe(t.Str),
    prezzo	                : t.maybe(t.Str),
    proposta	            : t.maybe(t.Str),
    proprietari	            : t.maybe(t.Str),
    street	                : t.maybe(t.Str),
    number	                : t.maybe(t.Str),
    filter	                : t.maybe(t.Str),
    venduto	                : t.maybe(t.Str),
    telefonoerrato	        : t.maybe(t.Str),
    nonrisponde	            : t.maybe(t.Str),
    entepubblico	        : t.maybe(t.Str),
    proprietario2	        : t.maybe(t.Str),
    famiglia	            : t.maybe(t.Str),
    fratelli	            : t.maybe(t.Str),
    figli	                : t.maybe(t.Str),
    elemento	            : t.maybe(t.Str),
    situacion	            : t.maybe(t.Str),
    calificacion	        : t.maybe(t.Str),
    precio	                : t.maybe(t.Str),
    codpla	                : t.maybe(t.Str),
    qualificacion	        : t.maybe(t.Str),
    urlimg	                : t.maybe(t.Str),
    urlmap	                : t.maybe(t.Str),
    urlpic	                : t.maybe(t.Str),
    id_negoziazione	        : t.maybe(t.Str),
    id_commerciale	        : t.maybe(t.Str),
    id_contatto	            : t.maybe(t.Str),
    nomecontatto	        : t.maybe(t.Str),
    telefonocontatto	    : t.maybe(t.Str),
    datacontatto	        : t.maybe(t.Str),
    prezzomax	            : t.maybe(t.Str),
    prezzorichiesto	        : t.maybe(t.Str),
    differenzialeprezzi	    : t.maybe(t.Str),

});



WorkSheetInputDTO.prototype.toDatabase = function () {

    let data = JSON.parse(JSON.stringify(this));
    data = modelHelper.removeNulls(data);

    // manual bindings
    let manual = {
        _documentType: 'worksheet',

        id: data.id_chiamatafornitore,
        buildingId: data.id_catastro,    
        supplierId: data.id_fornitore,


        lastOwner: {name: data.name, surname: data.cognome, phone: data.telefono},
        currentOwner: {name: data.proprietari },

        history:[
            { operator: data.id_operatorelivello1, date: data.data_livello1, action: 'create' }
        ],

        

        info: {
            state: data.street,
            date: data.number,
            tmStmp: data.tmStmp,
            cellulare__: data.cellulare,
            price: data.prezzo !== null ? parseFloat(data.prezzo) : undefined,
            proposedPrice: data.proposta !== null ? parseFloat(data.proposta) : undefined,
            city: data.filter,
            neighborhoodAndDistrict: data.elemento,
            situation: data.situacion,
            neighborhood: data.calificacion,
            district: data.urlimg,
            simpleNote: data.urlmap,
            simpleNote: data.urlmap,
            street: data.nomecontatto,
            dateApp: data.datacontatto,
            maxPrice: data.prezzomax !== null ? parseFloat(data.prezzomax) : undefined,
            requestedPrice: data.prezzorichiesto !== null ? parseFloat(data.prezzorichiesto) : undefined,
            negotationId: data.id_negoziazione,
            commercialOperatorId: data.id_commerciale,
        },
        
    };

    if (data.id_operatorelivello2 != null) {
        manual.history.push({ operator: data.id_operatorelivello2, date: data.data_livello2, action: 'update' });
    }

    if (data.visitare == "1") {
        manual.history.push({ action: 'visit', visitDate: data.data_visita });
    }

    if (data.richiamare == "1") {
        manual.history.push({ action: 'recall', recallDate: data.data_richiamo });
    }

    if (data.verificato == "1") {
        manual.history.push({ action: 'verificated' });
    }

    if (data.id_errore !== null) {
        manual.history.push({ action: 'error', errorId: data.id_errore });
    }
    else {
        if (data.errore == "1") {
            manual.history.push({ action: 'error' });
        }
    }

    if (data.novende !== null) {
        manual.history.push({ action: 'sells', sells: data.novende == "0" });
    }

    if (data.venduto == "1") {
        manual.history.push({ action: 'alreadySold' });
    }

    if (data.entepubblico == "1") {
        manual.history.push({ action: 'public' });
    }

    if (data.proprietario2 == "1") {
        manual.history.push({ action: 'proprietario2__' });
    }
    
    if (data.famiglia == "1") {
        manual.history.push({ action: 'family' });
    }

    if (data.fratelli == "1") {
        manual.history.push({ action: 'brothers' });
    }

    if (data.figli == "1") {
        manual.history.push({ action: 'sons' });
    }

    if (data.figli == "1") {
        manual.history.push({ action: 'sons' });
    }


    // mutable 
    
    let dataDTO = Object.assign( {}, data, manual);

    dataDTO = JSON.parse(JSON.stringify(new WorkSheetDTO(dataDTO)));

    return dataDTO;
};

module.exports.WorkSheetInputDTO = WorkSheetInputDTO;
module.exports.WorkSheetDTO      = WorkSheetDTO;