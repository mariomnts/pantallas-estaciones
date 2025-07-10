<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-2">Estación</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div v-if="selectedStation" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          @click="clearStation"
          type="button"
          class="text-slate-400 hover:text-slate-300 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <input
        v-model="searchQuery"
        @focus="showDropdown = true"
        @blur="hideDropdown"
        type="text"
        placeholder="Buscar estación..."
        :class="[
          'w-full pl-10 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ACDAC6] focus:border-[#ACDAC6] text-white placeholder-slate-400',
          selectedStation ? 'pr-12' : 'pr-4',
        ]"
      />
      <div
        v-if="showDropdown && filteredStations.length > 0"
        class="absolute z-10 w-full bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl"
      >
        <div
          v-for="station in filteredStations"
          :key="station.code"
          @mousedown="selectStation(station)"
          class="px-4 py-3 hover:bg-slate-600 cursor-pointer text-white flex items-center justify-between"
        >
          <div>
            <div class="font-medium">{{ station.name }}</div>
            <div class="text-sm text-slate-400">
              {{ station.location.town }}, {{ station.location.province }}
            </div>
          </div>
          <div class="text-xs text-slate-500 font-mono">{{ station.code }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Stations } from '../constants'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue', 'station-selected', 'station-cleared'])

const searchQuery = ref(props.modelValue)
const showDropdown = ref(false)
const selectedStation = ref(null)

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

const hideDropdown = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Watch for external changes to modelValue
import { watch } from 'vue'
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== searchQuery.value) {
      searchQuery.value = newValue
      if (!newValue) {
        selectedStation.value = null
      }
    }
  },
)
</script>
