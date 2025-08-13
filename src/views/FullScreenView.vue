<template>
  <div class="fullscreen-container">
    <Gravita class="w-full h-full" v-bind="gravitaProps" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Gravita from '../components/Gravita.vue'
import { parseUrlParamsToFormData, convertFormDataToGravitaProps } from '../utils/format'

const formData = ref({
  interfaz: 'departures',
  stationCode: '',
  traffic: ['cercanias', 'av', 'largaDistancia', 'regional'],
  languages: ['es'],
  showHeader: true,
  showAccess: true,
  showPlatform: true,
  showProduct: true,
  showNumber: true,
  countdown: false,
  showStops: true,
  showAllTrains: false,
  platformFilter: [],
  productFilter: [],
  companyFilter: [],
  customFilter: [],
  stopFilter: [],
  subtitle: '',
  subtitleParam: '',
  platformLocations: [],
  platformLocationRight: [],
  platformLocationLeft: [],
  displayNumber: '',
  platformMode: 'platform',
  platformTrigger: 'announced',
  showComposition: false,
  showObservation: false,
  platformArrangement: 'ascending',
  fontSize: 0,
})

// Parse URL parameters on mount
onMounted(() => {
  // Use query parameters only
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.toString()) {
    formData.value = parseUrlParamsToFormData(urlParams)

    window?.gtag?.('event', 'full_screen_view', {
      ...formData.value,
    })
  }
})

// Convert form data to Gravita props
const gravitaProps = computed(() => {
  return convertFormDataToGravitaProps(formData.value)
})
</script>

<style scoped>
.fullscreen-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile browsers */
  overflow: hidden;
  background: var(--color-blue, #001b41);
}

/* Fallback for browsers that don't support dvh */
@supports not (height: 100dvh) {
  .fullscreen-container {
    height: 100vh;
  }
}
</style>
