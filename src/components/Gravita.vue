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
  'platformFilter',
  'platformLocation',
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

    // 'pin-position': '0,120,240',
    // 'pin-style': 'stairs_up_left,pin,stairs_up_right',
    // 'if-no-trains': 'number',
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
  })

  board.value?.contentWindow?.postMessage(
    { target: 'grvta.setData', objData: JSON.stringify(data) },
    '*',
  )
}

function handleIncoming(raw) {
  // Prevent recursive calls by checking if we're already processing the same data
  if (lastMessageRaw.value === raw) {
    return
  }

  lastMessageRaw.value = raw

  try {
    const parsedData = JSON.parse(raw)
    sendBoardData(raw)
    emit('data', parsedData)
    if (!import.meta.env.PROD) {
      console.log('>', parsedData)
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
    <!-- <iframe ref="board" :src="iframeSrc" @load="handleBoardLoad"></iframe> -->
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
