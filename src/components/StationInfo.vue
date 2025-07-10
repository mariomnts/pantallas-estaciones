<template>
  <div v-if="selectedStation" class="bg-slate-700 rounded-lg p-4 border border-slate-600">
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
            class="px-2 py-1 bg-slate-600 rounded text-xs"
            >{{ platform }}</span
          >
        </div>
      </div>

      <div
        class="flex items-center justify-between pt-2 border-t border-slate-600"
        v-if="trainsLoaded"
      >
        <div class="flex items-center space-x-1.5 flex-shrink-0">
          <div class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <span class="text-green-400 text-xs">Conectado</span>
        </div>
        <div class="text-xs text-slate-400 flex-shrink-0 hidden sm:block">
          Trenes cargados: {{ trainsLoaded }}
        </div>
        <div class="text-xs text-slate-400 flex-shrink-0" v-if="currentTime">
          Actualizado: {{ currentTime }}
        </div>
      </div>
      <!-- Mobile-only row for train count -->
      <div class="sm:hidden text-xs text-slate-400 pt-1" v-if="trainsLoaded">
        Trenes cargados: {{ trainsLoaded }}
      </div>

      <div class="flex items-center space-x-2 pt-2 border-t border-slate-600" v-else>
        <div class="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse"></div>
        <span class="text-red-300 text-md">Adif no proporciona datos para esta estación</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedStation: Object,
  adifData: Object,
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
  return Object.keys(props.adifData?.station_settings?.platforms || {})
})

const trainsLoaded = computed(() => {
  return props.adifData?.trains?.length || 0
})
</script>
