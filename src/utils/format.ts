import { Interfaces, Traffics, Languages, Companies, SubtitlesList, Products } from '../constants'

export interface FormData {
  interfaz: string
  stationCode: string
  traffic: string[]
  languages: string[]
  showHeader: boolean
  showAccess: boolean
  showPlatform: boolean
  showProduct: boolean
  showNumber: boolean
  countdown: boolean
  showStops: boolean
  showAllTrains: boolean
  platformFilter: string[]
  productFilter: string[]
  companyFilter: string[]
  subtitle: string
  subtitleParam: string
  platformLocations: string[]
  displayNumber: string
  platformMode: string
  platformTrigger: string
  showComposition: boolean
  showObservation: boolean
  platformArrangement: string
  fontSize: string | number
  customFilter: string[]
  stopFilter: string[]
  platformLocationRight: string[]
  platformLocationLeft: string[]
}

export function convertFormDataToGravitaProps(formData: FormData) {
  // Find the interface to get its value
  const interfaceObj = Interfaces.find((i) => i.key === formData.interfaz)

  // Handle traffic - if nothing selected in UI, send all to Gravita
  const trafficValues =
    formData.traffic.length === 0
      ? Traffics.map((t) => t.value).join(',')
      : formData.traffic
          .map((key) => {
            const traffic = Traffics.find((t) => t.key === key)
            return traffic?.value || key
          })
          .join(',')

  // Handle languages - send selected ones
  const languagesValues = formData.languages
    .map((key) => {
      const lang = Languages.find((l) => l.key === key)
      return lang?.value
    })
    .join(',')

  // Handle subtitle with parameter replacement
  let subtitleValue = ''
  if (formData.subtitle) {
    const subtitle = SubtitlesList.find((s) => s.key === formData.subtitle)

    if (subtitle) {
      subtitleValue = subtitle.value

      if (subtitle.takesParam && formData.subtitleParam) {
        subtitleValue = subtitleValue.replace('$', formData.subtitleParam)
      }
    }
  }

  const props: any = {
    interfaz: interfaceObj?.value || formData.interfaz,
    stationCode: formData.stationCode,
    traffic: trafficValues,
    languages: languagesValues,
    fontSize:
      formData.fontSize === 0
        ? 'auto'
        : formData.fontSize !== undefined
          ? formData.fontSize
          : 'auto',
  }

  // Add conditional props based on interface
  if (formData.interfaz === 'arrivals' || formData.interfaz === 'departures') {
    props.showHeader = formData.showHeader
    props.showAccess = formData.showAccess
    props.showPlatform = formData.showPlatform
    props.showProduct = formData.showProduct
    props.showNumber = formData.showNumber
    props.countdown = formData.countdown
    props.maxShowStops = formData.showStops ? -1 : 0
    props.showAllTrains = formData.showAllTrains
    props.platformFilter = Array.isArray(formData.platformFilter)
      ? formData.platformFilter.join(',')
      : formData.platformFilter

    // Only add customFilter if custom filters are selected
    if (formData.customFilter.length > 0) {
      props.customFilter = formData.customFilter.join(',')
    }

    // Only add stopFilter if stop filters are selected
    if (formData.stopFilter.length > 0) {
      // Remove leading zeros from station codes
      const processedStopFilter = formData.stopFilter.map((code) => {
        return code.replace(/^0+/, '')
      })
      props.stopFilter = processedStopFilter.join(',')
    }

    // Only add productFilter if products are selected
    if (formData.productFilter.length > 0) {
      props.productFilter = formData.productFilter
        .map((key) => {
          const product = Products.find((p) => p.key === key)
          return product?.value || key
        })
        .join(',')
    }

    // Only add companyFilter if companies are selected
    if (formData.companyFilter.length > 0) {
      props.companyFilter = formData.companyFilter
        .map((key) => {
          const company = Companies.find((c) => c.key === key)
          return company?.value || key
        })
        .join(',')
    }

    if (subtitleValue) {
      props.subtitle = subtitleValue
    }
  }

  if (formData.interfaz === 'platform') {
    props.platformLocation = formData.platformLocations.join(',')
    props.platformLocationRight = formData.platformLocationRight.join(',')
    props.platformLocationLeft = formData.platformLocationLeft.join(',')
    props.platformMode = formData.platformMode
    props.platformTrigger = formData.platformTrigger
    props.showComposition = formData.showComposition
    props.showObservation = formData.showObservation
    props.platformArrangement = formData.platformArrangement
  }

  if (formData.interfaz === 'number') {
    props.platformLocation = formData.displayNumber?.toString() || ''
  }

  // Filter props based on interface
  return filterPropsByInterface(props, formData.interfaz)
}

// Generate URL from form data and selected station
export function generateUrl(formData: FormData, selectedStation: any): string {
  const baseUrl = window.location.origin + window.location.pathname + '~/'

  // Create a filtered version of formData based on interface
  const filteredFormData = filterFormDataByInterface(formData)
  const params = new URLSearchParams()

  // Add station code if station is selected
  if (selectedStation) {
    params.append('station', selectedStation.code)
  }

  // Add form data as URL params with special handling
  Object.entries(filteredFormData).forEach(([key, value]: [string, any]) => {
    // Handle traffic - if default selection (all except servicio interno), don't add to URL
    if (key === 'traffic') {
      const defaultTraffic = ['cercanias', 'av', 'largaDistancia', 'regional']
      const isDefault =
        value.length === defaultTraffic.length && defaultTraffic.every((t) => value.includes(t))

      if (value.length === 0 || isDefault) {
        return // Don't add to URL for empty or default selection
      }
      params.append(key, value.join(','))
      return
    }

    // Handle languages - only add if not default Spanish
    if (key === 'languages') {
      if (value.length === 1 && value[0] === 'es') {
        return // Don't add default Spanish to URL
      }
      params.append(key, value.join(','))
      return
    }

    // Handle productFilter, companyFilter, customFilter, and stopFilter - only add if selected
    if (
      key === 'productFilter' ||
      key === 'companyFilter' ||
      key === 'customFilter' ||
      key === 'stopFilter'
    ) {
      if (Array.isArray(value) && value.length > 0) {
        params.append(key, value.join(','))
      }
      return
    }

    // Handle subtitle with parameter replacement
    if (key === 'subtitle' && value) {
      const subtitle = SubtitlesList.find((s) => s.key === value)
      if (subtitle) {
        let subtitleValue = subtitle.value
        if (subtitle.takesParam && formData.subtitleParam) {
          subtitleValue = subtitleValue.replace('$', formData.subtitleParam)
        }
        params.append(key, subtitleValue)
      }
      return
    }

    // Skip subtitleParam as it's handled with subtitle
    if (key === 'subtitleParam') {
      return
    }

    // Handle platformLocations for platform interface
    if (key === 'platformLocations') {
      if (Array.isArray(value) && value.length > 0) {
        params.append('platformLocation', value.join(','))
      }
      return
    }

    // Handle platformSelectionRight for platform interface
    if (key === 'platformLocationRight') {
      if (Array.isArray(value) && value.length > 0) {
        params.append('platformLocationRight', value.join(','))
      }
      return
    }

    // Handle platformSelectionLeft for platform interface
    if (key === 'platformLocationLeft') {
      if (Array.isArray(value) && value.length > 0) {
        params.append('platformLocationLeft', value.join(','))
      }
      return
    }

    // Handle displayNumber for number interface
    if (key === 'displayNumber') {
      if (value) {
        params.append('platformLocation', String(value))
      }
      return
    }

    // Handle fontSize
    if (key === 'fontSize' && value !== undefined && value !== 0) {
      params.append('fontSize', String(value))
      return
    }

    // Handle showStops - convert to maxShowStops parameter
    if (key === 'showStops') {
      const maxShowStops = value ? -1 : 0
      params.append('maxShowStops', String(maxShowStops))
      return
    }

    // Handle showAllTrains - only add if true (since default is false)
    if (key === 'showAllTrains' && value === true) {
      params.append('showAllTrains', 'true')
      return
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.append(key, value.join(','))
      }
    } else if (value !== '' && value !== null && value !== undefined) {
      params.append(key, String(value))
    }
  })

  return `${baseUrl}?${params.toString()}`
}

// Helper function to filter form data by interface
export function filterPropsByInterface(props: any, interfaceKey: string) {
  const allAllowedProps = ['interfaz', 'stationCode', 'traffic', 'languages', 'fontSize']
  const allowedProps = {
    departures: [
      ...allAllowedProps,
      'showHeader',
      'showAccess',
      'showPlatform',
      'showProduct',
      'showNumber',
      'countdown',
      'maxShowStops',
      'showAllTrains',
      'platformFilter',
      'productFilter',
      'companyFilter',
      'customFilter',
      'stopFilter',
      'subtitle',
    ],
    arrivals: [
      ...allAllowedProps,
      'showHeader',
      'showAccess',
      'showPlatform',
      'showProduct',
      'showNumber',
      'countdown',
      'maxShowStops',
      'showAllTrains',
      'platformFilter',
      'productFilter',
      'companyFilter',
      'customFilter',
      'stopFilter',
      'subtitle',
    ],
    platform: [
      ...allAllowedProps,
      'platformLocation',
      'platformLocationRight',
      'platformLocationLeft',
      'platformMode',
      'platformTrigger',
      'showComposition',
      'showObservation',
      'platformArrangement',
    ],
    number: [...allAllowedProps, 'platformLocation'],
    clock: [...allAllowedProps],
  }

  const allowed = allowedProps[interfaceKey] || []
  const filtered: any = {}

  allowed.forEach((prop) => {
    if (props[prop] !== undefined) {
      filtered[prop] = props[prop]
    }
  })

  return filtered
}

// Helper function to filter form data by interface (for URL generation)
export function filterFormDataByInterface(data: any) {
  const interfaceKey = data.interfaz
  const allowedProps = {
    departures: [
      'interfaz',
      'traffic',
      'languages',
      'showHeader',
      'showAccess',
      'showPlatform',
      'showProduct',
      'showNumber',
      'countdown',
      'showStops',
      'showAllTrains',
      'platformFilter',
      'productFilter',
      'companyFilter',
      'customFilter',
      'stopFilter',
      'subtitle',
      'subtitleParam',
      'fontSize',
    ],
    arrivals: [
      'interfaz',
      'traffic',
      'languages',
      'showHeader',
      'showAccess',
      'showPlatform',
      'showProduct',
      'showNumber',
      'countdown',
      'showStops',
      'showAllTrains',
      'platformFilter',
      'productFilter',
      'companyFilter',
      'customFilter',
      'stopFilter',
      'subtitle',
      'subtitleParam',
      'fontSize',
    ],
    platform: [
      'interfaz',
      'traffic',
      'languages',
      'platformLocations',
      'platformLocationRight',
      'platformLocationLeft',
      'platformMode',
      'platformTrigger',
      'showComposition',
      'showObservation',
      'platformArrangement',
      'fontSize',
    ],
    number: ['interfaz', 'displayNumber', 'fontSize'],
    clock: ['interfaz', 'fontSize'],
  }

  const allowed = allowedProps[interfaceKey] || []
  const filtered: any = {}

  allowed.forEach((prop) => {
    if (data[prop] !== undefined) {
      filtered[prop] = data[prop]
    }
  })

  return filtered
}

export function parseUrlParamsToFormData(params: URLSearchParams): FormData {
  // Helper function to parse comma-separated values
  const parseArray = (value: string | null): string[] => {
    return value ? value.split(',').filter(Boolean) : []
  }

  // Helper function to parse boolean values
  const parseBoolean = (value: string | null, defaultValue: boolean = false): boolean => {
    if (value === null) return defaultValue
    return value === 'true' || value === '1'
  }

  // Map interface value back to key
  const interfaceValue = params.get('interfaz') || 'departures'
  const interfaceObj = Interfaces.find((i) => i.value === interfaceValue)
  const interfaceKey = interfaceObj?.key || interfaceValue

  // Map traffic values back to keys
  const trafficParam = params.get('traffic')
  let trafficKeys: string[] = []
  if (trafficParam) {
    const trafficValues = trafficParam.split(',')
    trafficKeys = trafficValues.map((value) => {
      const traffic = Traffics.find((t) => t.value === value)
      return traffic?.key || value
    })
  } else {
    // Default to all traffic except servicio interno
    trafficKeys = ['cercanias', 'av', 'largaDistancia', 'regional']
  }

  // Map languages values back to keys
  const languagesParam = params.get('languages') || 'ESP'
  const languagesValues = languagesParam.split(',')
  const languagesKeys = languagesValues.map((value) => {
    const lang = Languages.find((l) => l.value === value)
    return lang?.key || value
  })

  // Handle subtitle - check if it contains parameter and extract
  const subtitleParam = params.get('subtitle') || ''
  let subtitleKey = ''
  let subtitleParamValue = ''

  if (subtitleParam) {
    // Find matching subtitle by value
    const subtitle = SubtitlesList.find((s) => {
      if (s.takesParam) {
        // For parameterized subtitles, check if the param starts with the base value
        const baseValue = s.value.replace('$', '')
        return subtitleParam.startsWith(baseValue)
      }
      return s.value === subtitleParam
    })

    if (subtitle) {
      subtitleKey = subtitle.key
      if (subtitle.takesParam) {
        const baseValue = subtitle.value.replace('$', '')
        subtitleParamValue = subtitleParam.replace(baseValue, '')
      }
    }
  }

  // Map product values back to keys
  const productFilterParam = params.get('productFilter')
  let productFilterKeys: string[] = []
  if (productFilterParam) {
    const productValues = productFilterParam.split(',')
    productFilterKeys = productValues.map((value) => {
      const product = Products.find((p) => p.value === value)
      return product?.key || value
    })
  }

  // Map company values back to keys
  const companyFilterParam = params.get('companyFilter')
  let companyFilterKeys: string[] = []
  if (companyFilterParam) {
    const companyValues = companyFilterParam.split(',')
    companyFilterKeys = companyValues.map((value) => {
      const company = Companies.find((c) => c.value === value)
      return company?.key || value
    })
  }

  return {
    interfaz: interfaceKey,
    stationCode: params.get('station') || '',
    traffic: trafficKeys,
    languages: languagesKeys,
    showHeader: parseBoolean(params.get('showHeader'), true),
    showAccess: parseBoolean(params.get('showAccess'), true),
    showPlatform: parseBoolean(params.get('showPlatform'), true),
    showProduct: parseBoolean(params.get('showProduct'), true),
    showNumber: parseBoolean(params.get('showNumber'), true),
    countdown: parseBoolean(params.get('countdown'), false),
    showStops: (() => {
      const maxShowStops = params.get('maxShowStops')
      if (maxShowStops !== null) {
        // -1 means show all stops (true), 0 means show no stops (false)
        return maxShowStops === '-1'
      }
      return true
    })(),
    showAllTrains: parseBoolean(params.get('showAllTrains'), false),
    platformFilter: parseArray(params.get('platformFilter')),
    productFilter: productFilterKeys,
    companyFilter: companyFilterKeys,
    subtitle: subtitleKey,
    subtitleParam: subtitleParamValue,
    platformLocations: parseArray(params.get('platformLocation')),
    displayNumber: params.get('platformLocation') || '',
    platformMode: params.get('platformMode') || 'platform',
    platformTrigger: params.get('platformTrigger') || 'announced',
    showComposition: parseBoolean(params.get('showComposition'), false),
    showObservation: parseBoolean(params.get('showObservation'), false),
    platformArrangement: params.get('platformArrangement') || 'ascending',
    fontSize: params.get('fontSize') || 0,
    customFilter: parseArray(params.get('customFilter')),
    stopFilter: parseArray(params.get('stopFilter')),
    platformLocationRight: parseArray(params.get('platformLocationRight')),
    platformLocationLeft: parseArray(params.get('platformLocationLeft')),
  }
}
