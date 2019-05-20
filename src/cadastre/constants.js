export const keys = {
  PROVINCES: 'PROVINCES',
  CITIES: 'CITIES',
  STREETS: 'STREETS',
  BUILDING_BY_ADDRESS: 'BUILDING_BY_ADDRESS',
  BUILDING_BY_CADASTRE: 'BUILDING_BY_CADASTRE',
  LOCATION_BY_CADASTRE: 'LOCATION_BY_CADASTRE'
};

export const streetTypes = {
  AC: ['ACCESO'],
  AG: ['AGREGADO'],
  AL: ['ALDEA', 'ALAMEDA'],
  AN: ['ANDADOR'],
  AR: ['AREA', 'ARRABAL'],
  AU: ['AUTOPISTA'],
  AV: ['AVENIDA'],
  AY: ['ARROYO'],
  BJ: ['BAJADA'],
  BL: ['BLOQUE'],
  BO: ['BARRIO'],
  BQ: ['BARRANQUIL'],
  BR: ['BARRANCO'],
  CA: ['CAÑADA'],
  CG: ['COLEGIO', 'CIGARRAL'],
  CH: ['CHALET'],
  CI: ['CINTURON'],
  CJ: ['CALLEJA', 'CALLEJON'],
  CL: ['CALLE'],
  CM: ['CAMINO', 'CARMEN'],
  CN: ['COLONIA'],
  CO: ['CONCEJO', 'COLEGIO'],
  CP: ['CAMPA', 'CAMPO'],
  CR: ['CARRETERA', 'CARRERA'],
  CS: ['CASERIO'],
  CT: ['CUESTA', 'COSTANILLA'],
  CU: ['CONJUNTO'],
  CY: ['CALEYA'],
  CZ: ['CALLIZO'],
  DE: ['DETRÁS'],
  DP: ['DIPUTACION'],
  DS: ['DISEMINADOS'],
  ED: ['EDIFICIOS'],
  EM: ['EXTRAMUROS'],
  EN: ['ENTRADA', 'ENSANCHE'],
  EP: ['ESPALDA'],
  ER: ['EXTRARRADIO'],
  ES: ['ESCALINATA'],
  EX: ['EXPLANADA'],
  FC: ['FERROCARRIL'],
  FN: ['FINCA'],
  GL: ['GLORIETA'],
  GR: ['GRUPO'],
  GV: ['GRAN VIA'],
  HT: ['HUERTA', 'HUERTO'],
  JR: ['JARDINES'],
  LA: ['LAGO'],
  LD: ['LADO', 'LADERA'],
  LG: ['LUGAR'],
  MA: ['MALECON'],
  MC: ['MERCADO'],
  ML: ['MUELLE'],
  MN: ['MUNICIPIO'],
  MS: ['MASIAS'],
  MT: ['MONTE'],
  MZ: ['MANZANA'],
  PB: ['POBLADO'],
  PC: ['PLACETA'],
  PD: ['PARTIDA'],
  PI: ['PARTICULAR'],
  PJ: ['PASAJE', 'PASADIZO'],
  PL: ['POLIGONO'],
  PM: ['PARAMO'],
  PQ: ['PARROQUIA', 'PARQUE'],
  PR: ['PROLONGACION', 'CONTINUAC.'],
  PS: ['PASEO'],
  PT: ['PUENTE'],
  PU: ['PASADIZO'],
  PZ: ['PLAZA'],
  QT: ['QUINTA'],
  RA: ['RACONADA'],
  RB: ['RAMBLA'],
  RC: ['RINCON', 'RINCONA'],
  RD: ['RONDA'],
  RM: ['RAMAL'],
  RP: ['RAMPA'],
  RR: ['RIERA'],
  RU: ['RUA'],
  SA: ['SALIDA'],
  SC: ['SECTOR'],
  SD: ['SENDA'],
  SL: ['SOLAR'],
  SN: ['SALON'],
  SU: ['SUBIDA'],
  TN: ['TERRENOS'],
  TO: ['TORRENTE'],
  TR: ['TRAVESIA'],
  UR: ['URBANIZACION'],
  VA: ['VALLE'],
  VD: ['VIADUCTO'],
  VI: ['VIA'],
  VL: ['VIAL'],
  VR: ['VEREDA']
};

export const urls = {
  [keys.PROVINCES]: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaProvincia',
  [keys.CITIES]: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaMunicipio',
  [keys.STREETS]: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaVia',
  [keys.BUILDING_BY_ADDRESS]: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPLOC',
  [keys.BUILDING_BY_CADASTRE]: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx?op=Consulta_DNPRC',
  [keys.LOCATION_BY_CADASTRE]: 'http://ovc.catastro.meh.es/ovcservweb/ovcswlocalizacionrc/ovccoordenadas.asmx/Consulta_CPMRC'
};

const buildingTemplate = {
  building: {
    cadastre: {
      rc: {
        pc1: '//rc/pc1',
        pc2: '//rc/pc2',
        car: '//rc/car',
        cc1: '//rc/cc1',
        cc2: '//rc/cc2'
      },
      address: '//ldt'
    },
    address: {
      number: '//dir/pnp',
      type: '//dir/tv',
      street: '//dir/nv',
      city: '//nm',
      province: '//np',
      postalCode: {
        number: '//dp'
      }
    },
    use: '//debi/luso',
    propertyType: '//idbi/cn',
    entities: ['//cons', {
      surface: 'number(dfcons/stl)',
      type: 'lcd',
      plant: 'dt/lourb/loint/pt',
      door: 'dt/lourb/loint/pu'
    }],
    coefficient: '//cpt',
    floorArea: 'number(//sfc)',
    buildingDate: '//ant'
  },
  error: '//err/des'
};

export const templates = {
  [keys.PROVINCES]: {
    items: ['//prov', {
      id: 'cpine',
      name: 'np'
    }],
    error: '//err/des'
  },
  [keys.CITIES]: {
    items: ['//muni', {
      id: 'loine/cm',
      name: 'nm'
    }],
    error: '//err/des'
  },
  [keys.STREETS]: {
    items: ['//calle', {
      id: 'dir/cv',
      type: 'dir/tv',
      name: 'dir/nv'
    }],
    error: '//err/des'
  },
  [keys.BUILDING_BY_ADDRESS]: buildingTemplate,
  [keys.BUILDING_BY_CADASTRE]: buildingTemplate,
  [keys.LOCATION_BY_CADASTRE]: {
    srs: '//geo/srs',
    xcen: '//geo/xcen',
    ycen: '//geo/ycen',
    error: '//err/des'
  }
};
