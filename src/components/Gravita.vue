<script setup>
import { ref, onMounted, onBeforeUnmount, computed, defineProps, watch } from 'vue'
import * as signalR from '@microsoft/signalr'
import Adif from './Adif.vue'

const props = defineProps({
  stationCode: {
    type: String,
    required: true,
  },
  interfaz: {
    type: String,
    default: 'adif-gravita-departures',
  },
  countdown: {
    type: Boolean,
    default: true,
  },
  traffic: {
    type: String,
    default: 'C,L,R',
  },
  language: {
    type: String,
    default: 'ESP',
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showAccess: {
    type: Boolean,
    default: true,
  },
  showPlatform: {
    type: Boolean,
    default: true,
  },
  showPlatformSign: {
    type: Boolean,
    default: true,
  },
  showProduct: {
    type: Boolean,
    default: true,
  },
  showNumber: {
    type: Boolean,
    default: true,
  },
  platformFilter: {
    type: String,
    default: undefined,
  },
  platformLocation: {
    type: String,
    default: undefined,
  },
  platformTrigger: {
    type: String,
    default: undefined,
  },
  trafficFilter: {
    type: String,
    default: undefined,
  },
  companyFilter: {
    type: String,
    default: undefined,
  },
  productFilter: {
    type: String,
    default: undefined,
  },
  showComposition: {
    type: Boolean,
    default: true,
  },
  showPlatformPreview: {
    type: Boolean,
    default: true,
  },
  showClosedCheckIn: {
    type: Boolean,
    default: true,
  },
  platformArrangement: {
    type: String,
    default: undefined,
  },
  platformMode: {
    type: String,
    default: undefined,
  },
  showObservation: {
    type: Boolean,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(['data'])

const status = ref('connecting')
const lastMessageRaw = ref(null)
let connection = null

const board = ref(null)

const iframeSrc = computed(() => {
  const paramsObj = {
    rutaRecursos: '../../../recursos',
    'font-size': 1,
    interfaz: props.interfaz,
    IdEstacion: props.stationCode,
    countdown: props.countdown,
    traffic: props.traffic,
    languages: props.language,
    'show-header': props.showHeader,
    'show-access': props.showAccess,
    'show-platform': props.showPlatform,
    'show-platform-sign': props.showPlatformSign,
    'show-product': props.showProduct,
    'show-number': props.showNumber,
    'platform-filter': props.platformFilter,
    'platform-location': props.platformLocation,
    'platform-trigger': props.platformTrigger,
    'traffic-filter': props.trafficFilter,
    'company-filter': props.companyFilter,
    'product-filter': props.productFilter,
    'show-composition': props.showComposition,
    'show-platform-preview': props.showPlatformPreview,
    'show-closed-check-in': props.showClosedCheckIn,
    'show-observation': props.showObservation,
    'platform-arrangement': props.platformArrangement,
    'platform-mode': props.platformMode,
    subtitle: props.subtitle,
  }

  const filteredParams = Object.fromEntries(
    Object.entries(paramsObj).filter(([_, value]) => value !== undefined),
  )

  const params = new URLSearchParams(filteredParams)

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
  board.value?.contentWindow?.postMessage({ target: 'grvta.setData', objData: msg }, '*')
}

function handleIncoming(raw) {
  lastMessageRaw.value = raw
  sendBoardData(raw)
  emit('data', JSON.parse(raw))
  // console.log('[SignalR] Received message:', JSON.parse(raw))
}

onMounted(async () => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://info.adif.es/InfoStation', {
      skipNegotiation: true, // evita la petición /negotiate
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
        <Adif class="loader-logo" />
        <span class="loader-text" v-if="!props.stationCode">Selecciona estación</span>
      </div>
    </div>
    <iframe ref="board" :src="iframeSrc" @load="handleBoardLoad"></iframe>
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
  background-color: var(--adif-blue, #0053a5);
  z-index: 1;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loader-logo {
  width: 40%;
  fill: var(--adif-light-green, #8cc63f);
  animation: pulse-logo 2s ease-in-out infinite;
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
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
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
