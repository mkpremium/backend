var t = require('tcomb');
var modelHelper = require('./models-helper');

// =================================================================
// Operator
// =================================================================
var OwnerDTO = t.struct({

    _documentType: t.Str,
    id                  : t.Str,

    name			    : t.maybe(t.Str),
    phone			    : t.maybe(t.Str),
    fax			        : t.maybe(t.Str),
    mobile			    : t.maybe(t.Str),
    email			    : t.maybe(t.Str),
    web			        : t.maybe(t.Str),
    address			    : t.maybe(t.Str),
    postalCode			    : t.maybe(t.Str),
    cityId			    : t.maybe(t.Integer),
    communityId		    : t.maybe(t.Integer),
    stateId			    : t.maybe(t.Integer),
    countryId		    : t.maybe(t.Integer),
    fisCode			    : t.maybe(t.Str),
    pariva			    : t.maybe(t.Str),
    //id_banca		    : t.maybe(t.Str),
    //id_agenziabanca	: t.maybe(t.Str),
    ccb			        : t.maybe(t.Str),
    //intestatarioccb			: t.maybe(t.Str),
    notes			    : t.maybe(t.Str),
    tmstmp			    : t.maybe(t.Str),
    parentId			: t.maybe(t.Integer),
    catastroId			: t.maybe(t.Integer),
    important			: t.maybe(t.Boolean),
    phone2			    : t.maybe(t.Str),
    mainOwner           : t.maybe(t.Any),
    //street			: t.maybe(t.Str),
    //number			: t.maybe(t.Str),
    numberPB            : t.maybe(t.Str),
    numberIB            : t.maybe(t.Str),
    numberBD            : t.maybe(t.Str),
    numberABC           : t.maybe(t.Str),
    number1             : t.maybe(t.Str),
    number2             : t.maybe(t.Str),
    number3             : t.maybe(t.Str),
    verified			: t.maybe(t.Boolean),
    //id_errore			: t.maybe(t.Str),   
    filter  			: t.maybe(t.Str),    

}, { defaultProps: { _documentType: 'owner' } });

// =================================================================
// OperatorInput
// =================================================================
var OwnerInputDTO = t.struct({

    id_fornitore        : t.Str,
    ragionesociale		: t.maybe(t.Str),
    telefono			: t.maybe(t.Str),
    fax     			: t.maybe(t.Str),
    cellulare			: t.maybe(t.Str),
    email	    		: t.maybe(t.Str),
    internet			: t.maybe(t.Str),
    indirizzo			: t.maybe(t.Str),
    cap			        : t.maybe(t.Str),
    id_localita			: t.maybe(t.Str),
    id_comune			: t.maybe(t.Str),
    id_prov			    : t.maybe(t.Str),
    id_nazione			: t.maybe(t.Str),
    codfis		    	: t.maybe(t.Str),
    pariva			    : t.maybe(t.Str),
    id_banca		    : t.maybe(t.Str),
    id_agenziabanca		: t.maybe(t.Str),
    ccb			        : t.maybe(t.Str),
    intestatarioccb		: t.maybe(t.Str),
    note			    : t.maybe(t.Str),
    tmstmp			    : t.maybe(t.Str),
    id_padre			: t.maybe(t.Str),
    id_catastro			: t.maybe(t.Str),
    importante			: t.maybe(t.Str),
    altro_numero		: t.maybe(t.Str),
    proprietari			: t.maybe(t.Str),
    street			    : t.maybe(t.Str),
    number			    : t.maybe(t.Str),
    num_pb		    	: t.maybe(t.Str),
    num_ib	    		: t.maybe(t.Str),
    num_bd		    	: t.maybe(t.Str),
    num_abc	    		: t.maybe(t.Str),
    num_1	    		: t.maybe(t.Str),
    num_2	    		: t.maybe(t.Str),
    num_3	    		: t.maybe(t.Str),
    verificato			: t.maybe(t.Str),
    id_errore			: t.maybe(t.Str),    
    venduto		    	: t.maybe(t.Str),    
    telefonoerrato		: t.maybe(t.Str),    
    nonrisponde			: t.maybe(t.Str),    
    entepubblico		: t.maybe(t.Str),    
    proprietario2		: t.maybe(t.Str),    
    famiglia			: t.maybe(t.Str),    
    fratelli			: t.maybe(t.Str),    
    figli	    		: t.maybe(t.Str),    
    filter  			: t.maybe(t.Str),    
});



OwnerInputDTO.prototype.toDatabase = function () {
    
    // // manual bindings
    let manual = {
        _documentType: 'owner',
        id: this.id_fornitore,

        name: this.ragionesociale,		
        phone: this.telefono,		
        fax: this.fax,
        mobile: this.cellulare,
        email: this.email,
        web: this.internet,
        address: this.address,
        postalCode: this.cap,
        cityId: typeof this.id_localita !== "undefined" && this.id_localita !== "NULL" ? parseInt(this.id_localita) : undefined,
        communityId: typeof this.id_comune !== "undefined" && this.id_comune !== "NULL" ? parseInt(this.id_comune) : undefined,
        stateId: typeof this.id_prov !== "undefined" && this.id_prov !== "NULL" ? parseInt(this.id_prov) : undefined,
        countryId: typeof this.id_nazione !== "undefined" && this.id_nazione !== "NULL" ? parseInt(this.id_nazione) : undefined,
        fisCode: this.codfis,
        pariva: this.pariva,
        //id_banca	
        //id_agenzia
        ccb: this.ccb,
        //intestatar
        notes: this.note,		
        tmstmp: this.tmstmp,		
        parentId: typeof this.id_padre !== "undefined" && this.id_padre !== "NULL" ? parseInt(this.id_padre) : undefined,	
        catastroId: typeof this.id_catastro !== "undefined" && this.id_catastro !== "NULL" ? parseInt(this.id_catastro) : undefined,
        important: typeof this.importante !== "undefined" && this.importante !== "NULL" ? this.importante == '1' : undefined,
        phone2: this.altro_numero,
        mainOwner: { 
            name: this.proprietari, 
            street: this.street !== "NULL" ? this.street : null, 
            number: this.number !== "NULL" ? this.number : null, 
        },
        numberPB: this.num_pb, 
        numberIB: this.num_ib,    
        numberBD: this.num_bd,    
        numberABC: this.num_abc,   
        number1: this.num_1,     
        number2: this.num_2,     
        number3: this.num_3,
        verified: typeof this.verificato !== "undefined" && this.verificato !== "NULL" ? this.verificato == '1' : undefined,
        // //id_errore	
        filter: this.filter
    };

    manual = modelHelper.removeNulls(manual);
    
    // mutable OperatorDTO
    let ownerDTO = JSON.parse(JSON.stringify(new OwnerDTO(manual)));

    return ownerDTO;
};

module.exports.OwnerInputDTO = OwnerInputDTO;
module.exports.OwnerDTO = OwnerDTO;