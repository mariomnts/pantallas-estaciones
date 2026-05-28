<template>
  <div role="search">
    <label for="station-search" class="block text-sm font-medium text-slate-300 mb-2"
      >Estación</label
    >
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon aria-hidden="true" />
      </div>
      <div v-if="selectedStation" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          @click="clearStation"
          type="button"
          aria-label="Clear selected station"
          class="text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <ClearIcon aria-hidden="true" />
        </button>
      </div>
      <input
        id="station-search"
        v-model="searchQuery"
        @focus="onInputFocus"
        @blur="hideDropdown"
        type="text"
        placeholder="Buscar estación..."
        :class="[
          'w-full pl-10 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green text-white placeholder-slate-400',
          selectedStation ? 'pr-12 font-semibold' : 'pr-4',
        ]"
      />
      <div
        v-if="showDropdown && filteredStations.length > 0"
        class="absolute z-10 w-full bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl"
        role="listbox"
      >
        <div
          v-for="station in filteredStations"
          :key="station.code"
          @mousedown="selectStation(station)"
          role="option"
          class="px-4 py-3 hover:bg-slate-600 cursor-pointer text-white flex items-center justify-between"
        >
          <div>
            <div class="font-medium">{{ station.name }}</div>
            <div class="text-sm text-slate-400">
              {{ locationLabel(station.location) }}
            </div>
          </div>
          <div class="text-xs text-slate-500 font-mono">{{ station.code }}</div>
        </div>
      </div>
    </div>
    <div v-if="popularStationObjects.length > 0" class="flex flex-wrap gap-2 mt-2">
      <button
        v-for="station in popularStationObjects"
        :key="station.code"
        @mousedown.prevent="selectStation(station)"
        type="button"
        class="inline-flex items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
        :class="
          selectedStation?.code === station.code
            ? 'bg-dark-green text-dark-blue'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        "
      >
        {{ station.title }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SearchIcon from './icons/SearchIcon.vue'
import ClearIcon from './icons/ClearIcon.vue'
import { Stations, PopularStations } from '../constants'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue', 'station-selected', 'station-cleared'])

const searchQuery = ref(props.modelValue)
const showDropdown = ref(false)
const selectedStation = ref(null)

// Initialize selectedStation if modelValue matches a station
const initializeSelectedStation = () => {
  if (props.modelValue) {
    const station = Stations.find((s) => s.name === props.modelValue)
    if (station) {
      selectedStation.value = station
    }
  }
}

// Initialize on mount
import { onMounted } from 'vue'
onMounted(() => {
  initializeSelectedStation()
})

const filteredStations = computed(() => {
  if (!searchQuery.value) return Stations

  // Normalize the search query: remove accents, convert to lowercase, and trim whitespace
  const normalizedQuery = searchQuery.value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')

  return Stations.filter((station) => {
    // Only process if station and station.name exist
    if (!station?.name) return false

    // Normalize the station name in the same way
    const normalizedName = station.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')

    return normalizedName.includes(normalizedQuery)
  })
})

const selectStation = (station) => {
  selectedStation.value = station
  searchQuery.value = station.name
  showDropdown.value = false
  emit('update:modelValue', station.name)
  emit('station-selected', station)
}

const clearStation = () => {
  selectedStation.value = null
  searchQuery.value = ''
  emit('update:modelValue', '')
  emit('station-cleared')
}

const onInputFocus = () => {
  if (selectedStation.value) {
    searchQuery.value = ''
  }
  showDropdown.value = true
}

const hideDropdown = () => {
  setTimeout(() => {
    showDropdown.value = false
    // Restore station name if user left without selecting
    if (selectedStation.value && !searchQuery.value) {
      searchQuery.value = selectedStation.value.name
    }
  }, 200)
}

const locationLabel = (loc) => {
  const parts = []
  if (loc.town && loc.province && loc.town !== loc.province) {
    parts.push(loc.town, loc.province)
  } else if (loc.province) {
    parts.push(loc.province)
  } else if (loc.town) {
    parts.push(loc.town)
  }
  if (loc.country && loc.country !== 'España') {
    parts.push(loc.country)
  }
  return parts.join(', ')
}

const popularStationObjects = computed(() =>
  PopularStations.map(({ title, code }) => {
    const station = Stations.find((s) => s.code === code)
    return station ? { ...station, title } : null
  }).filter(Boolean),
)

// Watch for external changes to modelValue
import { watch } from 'vue'
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== searchQuery.value) {
      searchQuery.value = newValue
      if (!newValue) {
        selectedStation.value = null
      } else {
        // Find the station that matches the new value
        const station = Stations.find((s) => s.name === newValue)
        if (station) {
          selectedStation.value = station
        }
      }
    }
  },
  { immediate: true },
)
</script>
