<template>
  <div class="min-h-screen bg-slate-900 p-6">
    <div class="max-w-7xl mx-auto">
      <div
        class="flex flex-col md:flex-row items-center space-x-0 md:space-x-3 space-y-3 md:space-y-0 mb-7"
      >
        <div class="h-23 md:h-18 flex items-center justify-center flex-shrink-0 mr-5">
          <Logo class="logo w-full h-full" />
        </div>
        <div class="text-center md:text-left">
          <h1 class="text-2xl font-bold text-white leading-tight">Pantallas estaciones</h1>
          <p class="text-slate-400 text-md mt-1">Configurador pantallas información estaciones</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-slate-800 rounded-xl shadow-2xl p-4 lg:p-5 border border-slate-700">
          <StationFinder
            class="mb-4"
            v-model="formData.estacion"
            @station-selected="handleStationSelected"
            @station-cleared="handleStationCleared"
          />

          <StationInfo
            class="mb-4"
            :selected-station="selectedStation"
            :adif-data="adifData"
            :adif-status="adifStatus"
          />

          <StationForm
            :form-data="formData"
            :selected-station="selectedStation"
            :adif-data="adifData"
            @form-change="handleFormChange"
          />
        </div>

        <div class="space-y-6">
          <div class="bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-700">
            <div
              class="transition-all duration-700 ease-in-out overflow-hidden rounded-lg border border-slate-600"
              :class="isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]'"
            >
              <Gravita
                class="gravita w-full h-full"
                v-bind="gravitaProps"
                @data="handledata"
                @status="handlestatus"
              />
            </div>

            <div class="flex justify-start mt-4">
              <button
                @click="toggleAspectRatio"
                class="px-2 py-1 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors flex items-center space-x-1.5 border border-slate-600 text-xs cursor-pointer"
              >
                <DesktopIcon v-if="isPortrait" />
                <MobileIcon v-else />
                <span>{{ isPortrait ? '16:9' : '9:16' }}</span>
              </button>
            </div>

            <div class="mt-6 bg-light-green p-3 rounded-md border border-dark-green">
              <p class="text-xs text-dark-blue">
                Proyecto no oficial ni afiliado con ADIF con proposito educativo que permite
                configurar el sistema de información a viajeros de sus estaciones.
              </p>
            </div>
          </div>

          <div :class="{ 'opacity-50 pointer-events-none': !selectedStation }">
            <UrlSharing :url="generatedUrl" :disabled="!selectedStation" />
          </div>
        </div>
      </div>

      <footer class="mt-12 pb-8 text-center text-slate-500 text-sm">
        <div class="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <MonitorIcon />
          <div class="flex items-center gap-2">
            <span>por</span>
            <a
              href="https://x.com/mariomnts"
              target="_blank"
              class="hover:text-slate-400 transition-colors"
              >Mario Montes</a
            >
          </div>
          <span class="hidden sm:inline">•</span>
          <div>
            <a
              href="https://github.com/mariomnts/pantallas-estaciones"
              target="_blank"
              class="hover:text-slate-400 transition-colors"
              >Código en GitHub</a
            >
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Logo from '../components/icons/Logo.vue'
import DesktopIcon from '../components/icons/DesktopIcon.vue'
import MobileIcon from '../components/icons/MobileIcon.vue'
import MonitorIcon from '../components/icons/MonitorIcon.vue'
import Gravita from '../components/Gravita.vue'
import StationFinder from '../components/StationFinder.vue'
import StationInfo from '../components/StationInfo.vue'
import StationForm from '../components/StationForm.vue'
import UrlSharing from '../components/UrlSharing.vue'
import { convertFormDataToGravitaProps, generateUrl } from '../utils/format'
import { Stations } from '../constants'
import { onMounted } from 'vue'

// Form data
const formData = ref({
  interfaz: 'departures',
  stationCode: '17000',
  traffic: [], // Default none selected in UI
  languages: ['es'], // Default Spanish
  showHeader: true,
  showAccess: false,
  showPlatform: true,
  showProduct: true,
  showNumber: true,
  countdown: true,
  platformFilter: [], // Default none
  productFilter: [], // Changed from productFilter
  companyFilter: [], // Changed from companyFilter
  subtitle: '',
  subtitleParam: '',
  platformLocations: [],
  displayNumber: '',
  platformMode: 'platform',
  platformTrigger: 'next',
  showComposition: true,
  showObservation: true,
  platformArrangement: 'ascending',
  fontSize: 1,
  customFilter: [], // Línea de cercanías filter
  stopFilter: [], // Estaciones con parada filter
})

// Component state
const selectedStation = ref(Stations.find((s) => s.code === '17000') || null)
const adifData = ref(null)
const adifStatus = ref(null)
const isPortrait = ref(false)

// Set default station on mount
onMounted(() => {
  const defaultStation = Stations.find((s) => s.code === '17000')
  if (defaultStation) {
    selectedStation.value = defaultStation
    formData.value.stationCode = defaultStation.code
    formData.value.estacion = defaultStation.name
  }
})

// Toggle aspect ratio
const toggleAspectRatio = () => {
  isPortrait.value = !isPortrait.value
}

// Station handlers
const handleStationSelected = (station) => {
  selectedStation.value = station
  formData.value.stationCode = station.code
}

const handleStationCleared = () => {
  selectedStation.value = null
  adifData.value = null
  formData.value.stationCode = ''
}

const handleFormChange = (newFormData) => {
  formData.value = newFormData
}

const handledata = (data) => {
  adifData.value = data
}

const handlestatus = (status) => {
  adifStatus.value = status
}

// Computed props for Gravita component
const gravitaProps = computed(() => {
  return convertFormDataToGravitaProps(formData.value)
})

// URL generation
const generatedUrl = computed(() => {
  // Only generate URL if a station is selected
  if (!selectedStation.value) return 'Selecciona una estación...'
  return generateUrl(formData.value, selectedStation.value)
})

watch(
  formData,
  () => {
    window?.gtag?.('event', 'generation', {
      ...formData.value,
    })
  },
  { deep: true },
)
</script>

<style scoped>
.gravita {
  background: var(--color-blue);
}

.logo {
  stroke: var(--color-light-green);
  color: var(--color-light-green);
  fill: none;
}
</style>
