export interface CatastroResponse {
    consulta_dnprcResult: ConsultaDnprcResult;
}

export interface ConsultaDnprcResult {
    control: Control;
    bico:    Bico;
}

export interface Bico {
    bi:    BI;
    finca: Finca;
    lcons: Lcon[]; // Construcción
}

export interface BI {
    idbi: Idbi;
    dt:   BIDt;
    ldt:  string; //localizacion
    debi: Debi;
}

export interface Debi {
    luso: string; // Uso Principal: Residencial
    sfc:  string; // Superfície construida: 868 m2
    cpt:  string;
    ant:  string; // Año construcción: 1965
}

export interface BIDt {
    loine: Loine;
    cmc:   string;
    np:    string; //Provincia: Barcelona
    nm:    string; //Municipio: Barcelona
    locs:  Locs;
}

export interface Locs {
    lous: Lous;
}

export interface Lous {
    lourb: LousLourb;
}

export interface LousLourb {
    dir:   Dir; 
    loint: PurpleLoint;
    dp:    string; // Código Postal: 08013
    dm:    string;
}

export interface Dir {
    cv:  string;  //
    tv:  string; // CL
    nv:  string; // CASP
    pnp: string; // 192
    snp: string;
}

export interface PurpleLoint {
    es: string;
    pt: string;
    pu: string;
}

export interface Loine {
    cp: string;
    cm: string;
}

export interface Idbi {
    cn: string; //Clase: UR (Urbano)
    rc: RC;
}

export interface RC { //Referencia Catastral
    pc1: string; //1735701
    pc2: string; //DF3813F
    car: string; //0001
    cc1: string; //P
    cc2: string; //Y
}

export interface Finca {
    ldt:     string; //Localización: CL CASP 192 BARCELONA (BARCELONA)
    ltp:     string; //Parcela construida sin división horizontal
    dff:     Dff;
    infgraf: Infgraf;
}

export interface Dff {
    ss: string; // Superficie gráfica: 280 m2
}

export interface Infgraf {
    igraf: string; // Link Cartografía: "https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?del=8&mun=900&refcat=1735701DF3813F"
}

export interface Lcon {
    lcd:     LCD; //Uso Principal: ALMACEN, ELEMENTOS COMUNES o VIVIENDA
    dt?:     LconDt; //Piso Puerta 
    dfcons:  Dfcons; // Superficie m2
    dvcons?: Dvcons;
}

export interface Dfcons {
    stl: string; // Superficie m2: 24
}

export interface LconDt {
    lourb: DtLourb;
}

export interface DtLourb {
    loint: FluffyLoint;
}

export interface FluffyLoint {
    pt:  string; // Planta 0 o Planta PR o Planta 01
    pu?: string; // Puerta 01 o Puerta 02 o Puerta 05
}

export interface Dvcons {
    dtip: string;
}

export enum LCD {
    Almacen = "ALMACEN",
    ElementosComunes = "ELEMENTOS COMUNES",
    Vivienda = "VIVIENDA",
    Oficina = "OFICINA",
    Aparcamiento = "APARCAMIENTO"
}

export interface Control {
    cudnp:  number;
    cucons: number;
}
