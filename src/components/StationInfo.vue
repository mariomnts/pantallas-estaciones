<template>
  <div v-if="selectedStation" class="bg-slate-700 rounded-lg p-4 pb-3 border border-slate-600">
    <div class="space-y-3 text-sm">
      <div class="flex items-center space-x-2">
        <span class="text-slate-400">Código:</span>
        <span class="text-white font-mono">{{ selectedStation.code }}</span>
      </div>

      <div class="flex items-center space-x-2" v-if="platforms?.length">
        <span class="text-slate-400">Vías:</span>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="platform in platforms"
            :key="platform"
            class="px-2 py-1 bg-slate-600 rounded text-xs text-slate-400"
            >{{ platform }}</span
          >
        </div>
      </div>

      <div v-if="!adifStatus || adifStatus === 'connecting'">
        <div class="pt-2 border-t border-slate-600">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div class="flex items-center space-x-1.5">
              <div class="w-1.5 h-1.5 rounded-full animate-pulse bg-orange-400"></div>
              <span class="text-xs text-orange-400">Conectando</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="adifStatus === 'error'">
        <div class="pt-2 flex items-center space-x-2 border-t border-slate-600">
          <div class="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
          <span class="text-red-400 text-md"
            >ADIF está bloqueando esta conexión a sus servidores</span
          >
        </div>
      </div>

      <div v-else>
        <div class="pt-3 border-t border-slate-600" v-if="trainsLoaded">
          <!-- Desktop: single row with three sections, Mobile: two rows -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <!-- Conectado (always left) -->
            <div class="flex items-center space-x-1.5">
              <div
                class="w-1.5 h-1.5 rounded-full animate-pulse"
                :class="isDelayed ? 'bg-orange-400' : 'bg-green-400'"
              ></div>
              <span class="text-xs" :class="isDelayed ? 'text-orange-400' : 'text-green-400'">
                Conectado
              </span>
            </div>

            <!-- Trenes cargados (center on desktop, new line left on mobile) -->
            <div class="text-xs text-slate-400 sm:flex-1 sm:text-center">
              {{ trainsLoaded }} trenes cargados
            </div>

            <!-- Actualizado (always right) -->
            <div class="text-xs text-slate-400" v-if="currentTime">
              Actualizado: {{ currentTime }}
            </div>
          </div>
        </div>

        <!-- Warning message for delays -->
        <div v-if="isDelayed && trainsLoaded" class="pt-2 flex items-center space-x-1.5">
          <WarningIcon />
          <span class="text-xs text-orange-400">ADIF está enviando la información con retraso</span>
        </div>

        <div
          class="pt-2 flex items-center space-x-2 border-t border-slate-600"
          v-if="!trainsLoaded"
        >
          <div class="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse"></div>
          <span class="text-red-300 text-md">ADIF no proporciona datos para esta estación</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import WarningIcon from './icons/WarningIcon.vue'

const props = defineProps(['adifData', 'adifStatus', 'selectedStation'])

const currentTimestamp = ref(Date.now())
let intervalId = null

onMounted(() => {
  intervalId = setInterval(() => {
    currentTimestamp.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

const currentTime = computed(() => {
  const date = props.adifData?.station_settings?.data_time

  return date
    ? new Date(date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : ''
})

const platforms = computed(() => {
  const platformKeys = Object.keys(props.adifData?.station_settings?.platforms || {})
  return platformKeys.sort((a, b) => {
    // Try to sort numerically first
    const numA = parseInt(a, 10)
    const numB = parseInt(b, 10)

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }

    // Fall back to string comparison
    return a.localeCompare(b)
  })
})

const trainsLoaded = computed(() => {
  return props.adifData?.trains?.length || 0
})

const isDelayed = computed(() => {
  const date = props.adifData?.station_settings?.data_time
  if (!date) return false

  const dataTime = new Date(date)
  const now = new Date(currentTimestamp.value)
  const diffInMinutes = (now - dataTime) / (1000 * 60)

  return diffInMinutes > 10
})
</script>
