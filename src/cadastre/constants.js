export const keys = {
  PROVINCES: 'PROVINCES',
  CITIES: 'CITIES',
  STREET: 'STREET',
  BY_ADDRESS: 'BY_ADDRESS',
  BY_CADASTRE: 'BY_CADASTRE'
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
  [keys.STREET]: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaVia',
  [keys.BY_ADDRESS]: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/ConsultaNumero',
  [keys.BY_CADASTRE]: 'http://ovc.catastro.meh.es/ovcservweb/ovcswlocalizacionrc/ovccoordenadas.asmx/Consulta_CPMRC'
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
  [keys.STREET]: {
    items: ['//calle', {
      id: 'dir/cv',
      type: 'dir/tv',
      name: 'dir/nv'
    }],
    error: '//err/des'
  },
  [keys.BY_ADDRESS]: {
    first: '//pc/pc1',
    second: '//pc/pc2',
    third: '//pc/car',
    error: '//err/des'
  },
  [keys.BY_CADASTRE]: {
    srs: '//geo/srs',
    xcen: '//geo/xcen',
    ycen: '//geo/ycen',
    error: '//err/des'
  }
};
