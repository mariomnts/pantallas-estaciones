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
  'showAlerts',
  'platformFilter',
  'platformLocation',
  'platformLocationRight',
  'platformLocationLeft',
  'platformLocationForwardLeft',
  'platformLocationForwardRight',
  'platformTrigger',
  'trafficFilter',
  'companyFilter',
  'productFilter',
  'showComposition',
  'showPlatformPreview',
  'showClosedCheckIn',
  'showAlightingOnly',
  'platformArrangement',
  'platformMode',
  'showObservation',
  'sectorizationMode',
  'subtitle',
  'fontSize',
  'customFilter',
  'stopFilter',
  // Simulation-only props — control sendBoardData behaviour, NOT passed to iframe URL
  'simulateClosedCheckIn',
  'simulateAlightingOnly',
  'simulateAlertType',
  'simulatePlatformRouting',
  'simulateAccessOpeningMargin',
])

const emit = defineEmits(['data', 'status'])

const status = ref('connecting')
const lastMessageRaw = ref(null)
const iframeKey = ref(0)
let connection = null
// Platforms known from the last SignalR message. Updated in sendBoardData.
// Plain (non-reactive) so it doesn't trigger iframeSrc recomputes on every message.
let knownPlatforms = []
let lastReceivedAt = 0
let healthCheckTimer = null
let isReconnecting = false
let isChangingStation = false

const board = ref(null)

const connectionStationCode = computed(() => {
  return props.stationCode ? `PRO-ECM-${props.stationCode}` : null
})

const iframeSrc = computed(() => {
  const paramsObj = {
    rutaRecursos: '../../../recursos',
    IdEstacion: props.stationCode,
    'estimated-time-traffics': 'C',
    'countdown-traffics': 'C',
  }

  // Add all other props that are not undefined, converting camelCase to kebab-case
  // Simulation-only props are excluded — they only affect sendBoardData, not the iframe URL.
  const simulationOnlyProps = [
    'simulateClosedCheckIn',
    'simulateAlightingOnly',
    'simulateAlertType',
    'simulatePlatformRouting',
    'simulateAccessOpeningMargin',
  ]
  Object.keys(props).forEach((key) => {
    if (key !== 'stationCode' && props[key] !== undefined && !simulationOnlyProps.includes(key)) {
      // Convert camelCase to kebab-case for URL params
      const paramKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      paramsObj[paramKey] = props[key]
    }
  })

  // ====================================================================
  // SIMULATION: platform-routing + pin position/style
  // Controlled by simulatePlatformRouting prop. When enabled, adds a
  // hardcoded routing example for vías 1 and 2 so the walking-direction
  // SVG diagram can be previewed, plus the pin position and style params
  // needed to render the composition pin on the platform diagram.
  // ====================================================================
  if (props.simulatePlatformRouting) {
    // Build routing for every known platform: even-index → Right, odd-index → Left.
    // Falls back to a minimal example if no live data has arrived yet.
    const routing = knownPlatforms.length
      ? knownPlatforms.map((p, i) => `${p}:${i % 2 === 0 ? 'R' : 'L'}250`).join(',')
      : '1:R250,2:L150'
    paramsObj['platform-routing'] = routing
    paramsObj['pin-position'] = '10,130'
    paramsObj['pin-style'] = 'stairs_down_right,lift_down'
  }

  const params = new URLSearchParams(paramsObj)

  return props.stationCode
    ? `https://info.adif.es/assets/gravita/gravita.html?${params.toString()}`
    : ''
})

function handleBoardLoad() {
  if (lastMessageRaw.value) {
    setTimeout(() => {
      sendBoardData(JSON.parse(lastMessageRaw.value))
    }, 300)
  }
}

function clearBoardData() {
  lastMessageRaw.value = null
  knownPlatforms = []
  lastReceivedAt = 0
  emit('data', null)
  // Recreate the iframe so it cannot retain the previous station's board.
  iframeKey.value++
}

function sendBoardData(data) {

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

    // Add fake platform dimensions — only when simulating, so real API values are preserved.
    if (props.simulatePlatformRouting) {
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
    }

    data.station_settings.platforms = existingPlatforms

    // Keep a sorted list of known platforms so the simulation can generate
    // routing entries for every platform, not just the hardcoded 1 and 2.
    const sortedKeys = Object.keys(existingPlatforms).sort((a, b) => {
      const na = parseInt(a)
      const nb = parseInt(b)
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b)
    })
    if (sortedKeys.length) knownPlatforms = sortedKeys
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

    // ====================================================================
    // SIMULATION: stopping_point / stopping_point_reference + composition
    // Controlled by simulatePlatformRouting — enabled together with routing
    // and pin position so the full platform diagram can be previewed.
    // ====================================================================
    if (props.simulatePlatformRouting) {
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
    }
  })

  // ====================================================================
  // SIMULATION: check_in = "closed" (odd trains) + class_stop = "alighting_only" (even trains)
  // Applies per-index so both effects are visible at once when both are
  // enabled. Odd-indexed trains (1, 3, 5…) get check_in = "closed";
  // even-indexed trains (0, 2, 4…) get class_stop = "alighting_only".
  // Only trains that already have an assigned platform are affected.
  // ====================================================================
  if (props.simulateClosedCheckIn || props.simulateAlightingOnly) {
    data?.trains?.forEach((t, i) => {
      if (!t.platform?.trim()) return
      if (props.simulateClosedCheckIn && i % 2 !== 0) t.check_in = 'closed'
      if (props.simulateAlightingOnly && i % 2 === 0) t.class_stop = 'alighting_only'
    })
  }

  // ====================================================================
  // SIMULATION: departures_access_opening_margin / arrivals_access_opening_margin
  // Injects a cycling opening margin (minutes before departure/arrival) so
  // the Gravita library renders the "access will open at HH:MM" clock icon
  // instead of the access-code list. Four different values cycle per train
  // index to exercise both the "still pending" (clock shown) and the
  // "already open" (access codes shown) states depending on actual train time.
  // ====================================================================
  if (props.simulateAccessOpeningMargin) {
    const dMargins = [15, 30, 60, 90]
    const aMargins = [20, 45, 75, 110]
    data?.trains?.forEach((t, i) => {
      t.departures_access_opening_margin = dMargins[i % 4]
      t.arrivals_access_opening_margin = aMargins[i % 4]
    })
  }

  // ====================================================================
  // SIMULATION: station_alerts
  // Injects two alerts to exercise all rendering features:
  //
  //   alert 1 — no filter, no lines: always visible; tests basic layout,
  //             icon, header/description scroll and language cycling.
  //
  //   alert 2 — has `lines` (C1, C3a line badges rendered in the header)
  //             and a `filter.platforms` that restricts it to the first
  //             known platform. Tests badge rendering + filter logic.
  //             (If the monitor has no matching platform the alert is
  //             hidden by the library — that itself is useful to verify.)
  //
  // Full alert schema:
  //   id        string   — unique, URL-encoded internally by the library
  //   level     string   — "warning" | "info" | "works" | "severe"
  //                        warning/severe → disruption.svg (red)
  //                        info/works     → information|works.svg (blue)
  //   lines     string[] — Cercanías line codes; each becomes an <img>
  //                        src: https://info.adif.es/assets/gravita/lines/<code>.svg
  //   filter    object   — optional; alert only shown when monitor matches
  //                        { traffic_types, companies, products, accesses, platforms }
  //   message   object   — keyed by language code (ESP/ENG/CAT/EUS/GAL)
  //                        each value: { header: string, description: string }
  // ====================================================================
  if (props.simulateAlertType) {
    const alertContent = {
      warning: {
        lines: ['C02CERMAD', 'C05CERMAD'],
        header: 'Líneas C-2 y C-5 cortadas',
        description:
          'Se interrumpe la circulación en las líneas C-2 y C-5 por incidencia en la vía. Se habilitan servicios de bus alternativos.',
      },
      info: {
        lines: [],
        header: 'Retrasos generalizados en todas las líneas',
        description:
          'Se prevén retrasos de hasta 20 minutos en todos los servicios por saturación de la red. Consulte los paneles informativos.',
      },
      works: {
        lines: [],
        header: 'Obras de mejora en la estación',
        description:
          'La estación se encuentra en obras de renovación de infraestructuras. Pueden verse afectados algunos accesos y andenes hasta finales de mes.',
      },
      severe: {
        lines: [],
        header: 'Cierre total de la red ferroviaria',
        description:
          'Se ha decretado el cierre total de la red por causa de fuerza mayor. No habrá circulación hasta nuevo aviso de las autoridades competentes.',
      },
    }
    const content = alertContent[props.simulateAlertType] ?? alertContent.info
    data.station_alerts = [
      {
        id: 'sim_alert_1',
        level: props.simulateAlertType,
        ...(content.lines.length ? { lines: content.lines } : {}),
        message: {
          ESP: {
            header: content.header,
            description: content.description,
          },
        },
      },
    ]
  }

  emit('data', data)

  board.value?.contentWindow?.postMessage(
    { target: 'grvta.setData', objData: JSON.stringify(data) },
    '*',
  )
}

// 5-minute stale threshold
const STALE_MS = 5 * 60 * 1000
const RETRY_DELAYS_MS = [3_000, 6_000]
let retryTimer = null
let retryAttempt = 0

function cancelRetries() {
  clearTimeout(retryTimer)
  retryTimer = null
  retryAttempt = 0
}

function scheduleRetry() {
  if (!props.stationCode || retryTimer || retryAttempt >= RETRY_DELAYS_MS.length) return

  const delay = RETRY_DELAYS_MS[retryAttempt]
  retryAttempt++
  status.value = 'reconnecting'
  console.warn(`[SignalR] Retrying connection in ${delay / 1000} seconds (${retryAttempt}/2)`)

  retryTimer = setTimeout(async () => {
    retryTimer = null
    await reconnect()
  }, delay)
}

async function reconnect() {
  if (!props.stationCode || !connection || isReconnecting) return
  isReconnecting = true
  status.value = 'reconnecting'
  try {
    if (connection.state !== signalR.HubConnectionState.Disconnected) {
      await connection.stop()
    }
    await connection.start()
    await connection.invoke('JoinInfo', connectionStationCode.value)
    await connection.invoke('GetLastMessage', connectionStationCode.value)
  } catch (err) {
    console.error('[SignalR] Reconnect failed:', err)
    status.value = 'error'
    scheduleRetry()
  } finally {
    isReconnecting = false
  }
}

async function checkHealth() {
  if (!props.stationCode || !connection) return
  const isDisconnected = connection.state === signalR.HubConnectionState.Disconnected
  const isStale = lastReceivedAt > 0 && Date.now() - lastReceivedAt > STALE_MS
  if (isDisconnected || isStale) {
    console.warn(
      `[SignalR] Health check: ${isDisconnected ? 'disconnected' : 'stale'} — reconnecting`,
    )
    await reconnect()
  }
}

function handleIncoming(raw) {
  try {
    const data = JSON.parse(raw)

    // A message from a connection that is being replaced can arrive after the
    // station changes. Never render it on the newly selected station's board.
    const messageStationCode = data?.station_settings?.code
    if (messageStationCode && String(messageStationCode) !== String(props.stationCode)) {
      console.warn('[SignalR] Ignoring data for a different station:', messageStationCode)
      return
    }

    lastReceivedAt = Date.now()
    status.value = 'connected'
    cancelRetries()

    // Prevent recursive calls by checking if we're already processing the same data
    if (lastMessageRaw.value === raw) {
      return
    }

    sendBoardData(data)
    lastMessageRaw.value = raw

    if (!import.meta.env.PROD) {
      console.log('>', data)
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
    clearBoardData()
    status.value = 'error'
    scheduleRetry()
  })
  connection.onreconnecting((error) => {
    console.warn('[SignalR] Reconnecting:', error)
    status.value = 'reconnecting'
  })
  connection.onreconnected(async () => {
    try {
      await connection.invoke('JoinInfo', connectionStationCode.value)
      await connection.invoke('GetLastMessage', connectionStationCode.value)
    } catch (err) {
      console.error('[SignalR] Failed to rejoin after reconnecting:', err)
      clearBoardData()
      status.value = 'error'
      scheduleRetry()
    }
  })
  connection.onclose((error) => {
    if (isChangingStation) return

    if (error) {
      // SignalR reports server-side close errors (including the client timeout
      // OperationCanceledException) here, rather than through ReceiveError.
      console.error('[SignalR] Connection closed with an error:', error)
      clearBoardData()
      status.value = 'error'
      scheduleRetry()
    }
  })

  try {
    await connection.start()
    await connection.invoke('JoinInfo', connectionStationCode.value)
    await connection.invoke('GetLastMessage', connectionStationCode.value)

    healthCheckTimer = setInterval(checkHealth, 60_000)
  } catch (err) {
    console.error('[SignalR] error:', err)
    status.value = 'error'
    scheduleRetry()
  }
})

watch(
  () => props.stationCode,
  async () => {
    if (!connection || !props.stationCode) return

    cancelRetries()
    clearBoardData()
    status.value = 'connecting'
    isChangingStation = true
    try {
      await connection.stop()
      await connection.start()
      await connection.invoke('JoinInfo', connectionStationCode.value)
      await connection.invoke('GetLastMessage', connectionStationCode.value)
    } catch (err) {
      console.error('[SignalR] Failed to change station:', err)
      clearBoardData()
      status.value = 'error'
      scheduleRetry()
    } finally {
      isChangingStation = false
    }
  },
)

watch(
  () => status.value,
  (newStatus) => {
    emit('status', newStatus)
  },
)

// Reload the iframe when simulation props change so the Gravita library
// re-initialises with the new data. simulatePlatformRouting already reloads
// via iframeSrc; the rest use iframeKey to force Vue to recreate the element.
watch(
  () => [
    props.simulateClosedCheckIn,
    props.simulateAlightingOnly,
    props.simulateAlertType,
    props.simulatePlatformRouting,
    props.simulateAccessOpeningMargin,
  ],
  () => {
    iframeKey.value++
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  clearInterval(healthCheckTimer)
  healthCheckTimer = null
  cancelRetries()
  connection?.stop()
  connection = null
  status.value = 'disconnected'
})
</script>

<template>
  <div class="gravita-container">
    <div v-if="status !== 'connected'" class="loader-container">
      <div class="loader-content">
        <Logo class="loader-logo" />
        <span class="loader-text" v-if="props.stationCode && status === 'error'">No se han podido cargar los datos de ADIF</span>
        <span class="loader-text" v-else-if="props.stationCode && status === 'reconnecting'">Reconectando con ADIF…</span>
        <span class="loader-text" v-else-if="props.stationCode">Cargando datos de ADIF…</span>
      </div>
    </div>
    <iframe
      ref="board"
      v-if="status !== 'error'"
      :key="iframeKey"
      :src="iframeSrc"
      @load="handleBoardLoad"
    ></iframe>
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
