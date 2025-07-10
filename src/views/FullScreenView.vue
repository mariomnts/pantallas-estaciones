<template>
  <div class="w-screen h-screen overflow-hidden">
    <Gravita class="w-screen h-screen" v-bind="gravitaProps" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Gravita from '../components/Gravita.vue'
import { parseUrlParamsToFormData, convertFormDataToGravitaProps } from '../utils/format'

const formData = ref({
  interfaz: 'departures',
  stationCode: '',
  traffic: [],
  language: ['es'],
  showHeader: true,
  showAccess: true,
  showPlatform: true,
  showProduct: true,
  showNumber: true,
  countdown: false,
  platformFilter: [],
  productFilter: [],
  companyFilter: [],
  subtitle: '',
  subtitleParam: '',
  platformLocations: [],
  displayNumber: '',
  platformMode: 'platform',
  platformTrigger: 'announced',
  showComposition: false,
  showObservation: false,
  platformArrangement: 'ascending',
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