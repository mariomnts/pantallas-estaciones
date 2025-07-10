export { Stations } from './stations'

export const Interfaces = [
  { key: 'departures', value: 'adif-gravita-departures', label: 'Salidas' },
  { key: 'arrivals', value: 'adif-gravita-arrivals', label: 'Llegadas' },
  { key: 'platform', value: 'adif-gravita-platform', label: 'Vía' },
  { key: 'number', value: 'adif-gravita-number', label: 'Número' },
  { key: 'clock', value: 'adif-gravita-clock', label: 'Reloj' },
]

export const Traffics = [
  { key: 'cercanias', value: 'C', label: 'Cercanías' },
  { key: 'largaDistancia', value: 'L', label: 'Larga Distancia' },
  { key: 'regional', value: 'R', label: 'Regional' },
]

export const Products = [
  { key: 'iryo', value: 'IRYO', label: 'Iryo' },
  { key: 'avlo', value: 'AVLO', label: 'Avlo' },
  { key: 'md', value: 'MD', label: 'Media Distancia' },
  { key: 'avant', value: 'AVANT', label: 'Avant' },
  { key: 'rex', value: 'REX', label: 'Reg. Express' },
  { key: 'intercity', value: 'ICITY', label: 'Intercity' },
  { key: 'ave', value: 'AVE', label: 'AVE' },
  { key: 'sserv', value: 'SSERV', label: 'Serv. Especiales' },
  { key: 'cercanias', value: 'CERCAN', label: 'Cercanías' },
  { key: 'ouigo', value: 'OUIGO', label: 'Ouigo' },
  { key: 'alvia', value: 'ALVIA', label: 'Alvia' },
]

export const Languages = [
  { key: 'es', value: 'ESP', label: 'Español' },
  { key: 'en', value: 'ENG', label: 'English' },
  { key: 'ca', value: 'CAT', label: 'Català' },
  { key: 'eu', value: 'EUS', label: 'Euskera' },
  { key: 'gl', value: 'GAL', label: 'Galego' },
  { key: 'va', value: 'VAL', label: 'Valencià' },
]

export const Companies = [
  { key: 'renfe', value: 'RENFE', label: 'Renfe' },
  { key: 'iryo', value: 'IRYO', label: 'Iryo' },
  { key: 'ouigo', value: 'OUIGO', label: 'Ouigo' },
]

export const SubtitlesList = [
  { key: 'av', value: 'AV', label: 'Alta Velocidad' },
  { key: 'cerc', value: 'CERC', label: 'Cercanías' },
  { key: 'cercmd', value: 'CERCMD', label: 'Cercanías · Regional' },
  { key: 'md', value: 'MD', label: 'Regional' },
  { key: 'ld', value: 'LD', label: 'Larga Distancia' },
  { key: 'ldav', value: 'LDAV', label: 'Larga Distancia · Alta Velocidad' },
  { key: 'mdld', value: 'MDLD', label: 'Regional · Larga Distancia' },
  { key: 'mdlconv', value: 'MDLDCONV', label: 'Regional · Larga Distancia Convencional' },
  { key: 'cercmdldconv', value: 'CERCMDLDCONV', label: 'Cercanías · Regional · Larga Distancia Convencional' },
  { key: 'aeropuerto', value: 'AEROPUERTO', label: 'Conexiones al aeropuerto' },
  {
    key: 'operador:$',
    value: 'OPERADOR:$',
    label: 'Servicios operados por ...',
    takesParam: true,
  },
  {
    key: 'via:$',
    value: 'VIA:$',
    label: 'Vía ...',
    takesParam: true,
  },
]

export const PlatformArrangements = [
  { key: 'asc', value: 'ascending', label: 'Ascendente' },
  { key: 'desc', value: 'descending', label: 'Descendente' },
]

export const PlatformTriggerList = [
  { key: 'announced', value: 'announced', label: 'Anunciado' },
  { key: 'check-in', value: 'check-in', label: 'Check-in' },
  { key: 'next', value: 'next', label: 'Siguiente tren' },
]

export const PlatformModes = [
  { key: 'platform', value: 'platform', label: 'Andén' },
  { key: 'check-in', value: 'check-in', label: 'Check-in' },
  { key: 'access', value: 'access', label: 'Acceso' },
]

export const VisualizationOptions = [
  { key: 'showHeader', label: 'Mostrar cabecera' },
  { key: 'showAccess', label: 'Mostrar acceso' },
  { key: 'showPlatform', label: 'Mostrar andén' },
  { key: 'showProduct', label: 'Mostrar producto' },
  { key: 'showNumber', label: 'Mostrar número' },
  { key: 'countdown', label: 'Cuenta atrás' },
]

export const PlatformBooleanOptions = [
  { key: 'showComposition', label: 'Mostrar composición' },
  { key: 'showObservation', label: 'Mostrar observación' },
]
