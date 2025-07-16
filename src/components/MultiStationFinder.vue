<template>
  <div>
    <div class="flex flex-wrap gap-2">
      <!-- Display selected stations as badges -->
      <div v-for="stationCode in selectedStations" :key="stationCode" class="group">
        <div
          class="inline-flex items-center px-2 py-1 rounded text-sm bg-dark-green text-dark-blue"
        >
          {{ getStationName(stationCode) }}
          <button
            @click.prevent="removeStation(stationCode)"
            class="ml-1 text-dark-blue opacity-50 hover:opacity-100 w-4 h-4 flex items-center justify-center"
          >
            <CloseIcon class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- Compact station finder for adding new stations -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <SearchIcon class="h-2 w-2" />
        </div>
        <input
          v-model="searchQuery"
          @focus="showDropdown = true"
          @blur="hideDropdown"
          type="text"
          placeholder="Buscar..."
          class="w-32 pl-9 pr-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-dark-green focus:border-dark-green"
        />
        <div
          v-if="showDropdown && filteredStations.length > 0"
          class="absolute z-10 w-64 bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl"
        >
          <div
            v-for="station in filteredStations"
            :key="station.code"
            @mousedown="selectStation(station)"
            class="px-3 py-2 hover:bg-slate-600 cursor-pointer text-white flex items-center justify-between"
          >
            <div>
              <div class="font-medium text-sm">{{ station.name }}</div>
              <div class="text-xs text-slate-400">
                {{ station.location.town }}, {{ station.location.province }}
              </div>
            </div>
            <div class="text-xs text-slate-500 font-mono">{{ station.code }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SearchIcon from './icons/SearchIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'
import { Stations } from '../constants'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedStations = ref([...props.modelValue])
const searchQuery = ref('')
const showDropdown = ref(false)

// Watch for changes in modelValue
import { watch } from 'vue'
watch(
  () => props.modelValue,
  (newValue) => {
    // Only update if the values are actually different to prevent circular updates
    if (JSON.stringify(selectedStations.value) !== JSON.stringify(newValue)) {
      selectedStations.value = [...newValue]
    }
  },
)

// Watch for changes in selectedStations and emit
watch(
  selectedStations,
  (newValue) => {
    // Only emit if the values are actually different to prevent circular updates
    if (JSON.stringify(props.modelValue) !== JSON.stringify(newValue)) {
      emit('update:modelValue', newValue)
    }
  },
  { deep: true },
)

// Filter stations excluding already selected ones
const filteredStations = computed(() => {
  if (!searchQuery.value) return []

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

    // Skip if already selected
    if (selectedStations.value.includes(station.code)) return false

    // Normalize the station name in the same way
    const normalizedName = station.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')

    return normalizedName.includes(normalizedQuery)
  })
})

// Get station name by code
const getStationName = (code) => {
  const station = Stations.find((s) => s.code === code)
  return station ? station.name : code
}

// Select a station
const selectStation = (station) => {
  if (!selectedStations.value.includes(station.code)) {
    selectedStations.value.push(station.code)
  }
  searchQuery.value = ''
  showDropdown.value = false
}

// Remove a station
const removeStation = (code) => {
  selectedStations.value = selectedStations.value.filter((s) => s !== code)
}

// Hide dropdown with delay
const hideDropdown = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>
