<script setup>
import { ref, onMounted, onBeforeUnmount, computed, defineProps, watch } from 'vue'
import * as signalR from '@microsoft/signalr'
import Logo from './icons/Logo.vue'

const props = defineProps([
  'stationCode',
  'interfaz',
  'countdown',
  'traffic',
  'languages',
  'showHeader',
  'showAccess',
  'showPlatform',
  'showPlatformSign',
  'showProduct',
  'showNumber',
  'maxShowStops',
  'showAllTrains',
  'platformFilter',
  'platformLocation',
  'platformLocationRight',
  'platformLocationLeft',
  'platformTrigger',
  'trafficFilter',
  'companyFilter',
  'productFilter',
  'showComposition',
  'showPlatformPreview',
  'showClosedCheckIn',
  'platformArrangement',
  'platformMode',
  'showObservation',
  'subtitle',
  'fontSize',
  'customFilter',
  'stopFilter',
])

const emit = defineEmits(['data', 'status'])

const status = ref('connecting')
const lastMessageRaw = ref(null)
let connection = null

const board = ref(null)

const iframeSrc = computed(() => {
  const paramsObj = {
    rutaRecursos: '../../../recursos',
    IdEstacion: props.stationCode,
    'estimated-time-traffics': 'C',
    'countdown-traffics': 'C',

    'pin-position': '10,130',
    'pin-style': 'stairs_down_right,lift_down',
  }

  // Add all other props that are not undefined, converting camelCase to kebab-case
  Object.keys(props).forEach((key) => {
    if (key !== 'stationCode' && props[key] !== undefined) {
      // Convert camelCase to kebab-case for URL params
      const paramKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      paramsObj[paramKey] = props[key]
    }
  })

  const params = new URLSearchParams(paramsObj)

  return props.stationCode
    ? `https://info.adif.es/assets/gravita/gravita.html?${params.toString()}`
    : ''
})

function handleBoardLoad() {
  if (lastMessageRaw.value) {
    setTimeout(() => {
      sendBoardData(lastMessageRaw.value)
    }, 300)
  }
}

function sendBoardData(msg) {
  const data = JSON.parse(msg)

  // Extract platforms from trains and add to station settings if not already present
  if (data?.trains && data?.station_settings) {
    const existingPlatforms = data.station_settings?.platforms || {}

    const trainPlatforms = new Set()
    data.trains.forEach((train) => {
      if (train.platform && train.platform.trim()) {
        trainPlatforms.add(train.platform.trim())
      }
    })

    // Add new platforms that don't exist in station settings
    trainPlatforms.forEach((platform) => {
      if (!existingPlatforms.hasOwnProperty(platform)) {
        existingPlatforms[platform] = {
          fakeFromTrains: true,
        }
      }
    })

    // Add platform dimensions to each platform
    Object.keys(existingPlatforms).forEach((platformKey) => {
      existingPlatforms[platformKey] = {
        ...existingPlatforms[platformKey],
        platform_start: 0,
        platform_end: 150,
        track_start: 0,
        track_end: 150,
        sectors: existingPlatforms[platformKey]?.sectors || [],
      }
    })

    data.station_settings.platforms = existingPlatforms
  }

  data?.trains?.forEach((train) => {
    const destinationCercanias = train?.destinations?.[0]?.line
      ?.replace(/ROD[A-Z0-9]*|CER[A-Z0-9]*|TRA[A-Z0-9]*/g, '')
      .replace(/CIVGUACHA/g, 'CIVIS')
      .trim()

    if (train?.traffic_type == 'C' && destinationCercanias) {
      train.custom_categories = [
        destinationCercanias.toUpperCase(),
        destinationCercanias.replace(/([A-Z])0?([1-9])/g, '$1$2').toUpperCase(),
        destinationCercanias.replace(/([A-Z])0?([1-9])/g, '$1-$2').toUpperCase(),
      ]
    }

    if (['IRYO', 'IRY'].includes(train?.commercial_id?.[0]?.product)) {
      train.company = 'IRYO'
    }

    if (['OUIGO', 'OUI'].includes(train?.commercial_id?.[0]?.product)) {
      train.company = 'OUIGO'
    }

    // Ensure train has a sectors property
    train.sectors = train.sectors || []

    // fake composition
    train.orientation_out = 'left'
    train.stopping_point = 30
    train.stopping_point_reference = 'left'

    if (train?.commercial_id?.[0]?.product != 'CERCAN') {
      train.composition = [
        [
          { type: 'A', length: 100, number: '01' },
          { type: 'C', length: 100, number: '02' },
          { type: 'C', length: 100, info: ['bar'] },
          { type: 'A', length: 100, number: '06' },
        ],
        [
          { type: 'A', length: 100, number: '07' },
          { type: 'C', length: 100, number: '08' },
          { type: 'C', length: 100, info: ['accessible'] },
          { type: 'A', length: 100, number: '10' },
        ],
      ]
    } else {
      train.composition = [
        [
          { type: 'A', length: 100, info: ['medium_occupancy'] },
          { type: 'C', length: 100, info: ['low_occupancy'] },
          { type: 'C', length: 100, info: ['low_occupancy'] },
          { type: 'A', length: 100, info: ['low_occupancy'] },
        ],
        [
          { type: 'A', length: 100, info: ['high_occupancy'] },
          { type: 'C', length: 100, info: ['high_occupancy'] },
          { type: 'C', length: 100, info: ['medium_occupancy'] },
          { type: 'A', length: 100, info: ['high_occupancy'] },
        ],
      ]
    }
  })

  emit('data', data)

  board.value?.contentWindow?.postMessage(
    { target: 'grvta.setData', objData: JSON.stringify(data) },
    '*',
  )
}

function handleIncoming(raw) {
  status.value = 'connected'

  // Prevent recursive calls by checking if we're already processing the same data
  if (lastMessageRaw.value === raw) {
    return
  }

  try {
    sendBoardData(raw)
    lastMessageRaw.value = raw

    if (!import.meta.env.PROD) {
      console.log('>', JSON.parse(raw))
    }
  } catch (error) {
    console.error('[Gravita] Error parsing incoming data:', error)
  }
}

onMounted(async () => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://info.adif.es/InfoStation', {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .configureLogging(signalR.LogLevel.Error)
    .withAutomaticReconnect()
    .build()

  connection.on('ReceiveMessage', handleIncoming)
  connection.on('ReceiveError', (error) => {
    console.error('[SignalR] ReceiveError:', error)
  })

  try {
    await connection.start()
    await connection.invoke('JoinInfo', `ECM-${props.stationCode}`)
    await connection.invoke('GetLastMessage', `ECM-${props.stationCode}`)

    status.value = 'online'
  } catch (err) {
    console.error('[SignalR] error:', err)
    status.value = 'error'
  }
})

watch(
  () => props.stationCode,
  async () => {
    await connection?.stop()
    await connection.start()
    await connection.invoke('JoinInfo', `ECM-${props.stationCode}`)
    await connection.invoke('GetLastMessage', `ECM-${props.stationCode}`)
  },
)

watch(
  () => status.value,
  (newStatus) => {
    emit('status', newStatus)
  },
)

onBeforeUnmount(() => {
  connection?.stop()
  connection = null
  status.value = 'disconnected'
})
</script>

<template>
  <div class="gravita-container">
    <div class="loader-container">
      <div class="loader-content">
        <Logo class="loader-logo" />
        <span class="loader-text" v-if="!props.stationCode">Selecciona estación</span>
      </div>
    </div>
    <iframe ref="board" v-if="status !== 'error'" :src="iframeSrc" @load="handleBoardLoad"></iframe>
  </div>
</template>

<style scoped>
.gravita-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.loader-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-blue, #0053a5);
  z-index: 1;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loader-logo {
  width: 35%;
  stroke: var(--color-light-green);
  color: var(--color-light-green);
  fill: none;
  animation: pulse-logo 1.5s ease-in-out infinite;
}

.loader-text {
  color: white;
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-align: center;
  opacity: 0.7;
}

@keyframes pulse-logo {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.3;
  }
}

iframe {
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  cursor: none;
  z-index: 2;
}
</style>
