<template>
  <div class="bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-700">
    <h3 class="text-base font-medium text-white mb-3">Compartir pantalla</h3>
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <input
        :value="url"
        readonly
        :disabled="props.disabled"
        class="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm min-w-0"
        :class="{ 'opacity-50': props.disabled }"
      />
      <div class="flex gap-2 sm:flex-shrink-0">
        <button
          @click="copyUrl"
          :disabled="props.disabled"
          :class="[
            'px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-initial cursor-pointer',
            copied
              ? 'bg-white text-dark-blue'
              : 'bg-dark-green hover:bg-light-green text-dark-blue',
            props.disabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <CopyIcon v-if="!copied" />
          <div v-else class="w-4 h-4">
            <CheckmarkIcon />
          </div>
        </button>
        <button
          @click="openUrl"
          :disabled="props.disabled"
          class="px-4 py-3 bg-dark-green text-dark-blue rounded-lg hover:bg-light-green transition-colors flex items-center justify-center flex-1 sm:flex-initial cursor-pointer"
          :class="{ 'opacity-50 cursor-not-allowed': props.disabled }"
        >
          <ExternalLinkIcon />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CopyIcon from './icons/CopyIcon.vue'
import CheckmarkIcon from './icons/CheckmarkIcon.vue'
import ExternalLinkIcon from './icons/ExternalLinkIcon.vue'

const props = defineProps({
  url: String,
  disabled: {
    type: Boolean,
    default: false,
  },
})

const copied = ref(false)

const copyUrl = async () => {
  if (props.disabled) return

  try {
    await navigator.clipboard.writeText(props.url)
    window?.gtag?.('event', 'url_copy_click')
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Error copying URL:', err)
  }
}

const openUrl = () => {
  if (props.disabled) return
  window.open(props.url, '_blank')

  window?.gtag?.('event', 'url_open_click')
}
</script>
