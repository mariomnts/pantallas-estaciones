<template>
  <div class="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
    <h3 class="text-lg font-medium text-white mb-4">Compartir pantalla</h3>
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
            'px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-initial',
            copied ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#ACDAC6] hover:bg-[#9BC7B3] text-[#102341]',
            props.disabled ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button
          @click="openUrl"
          :disabled="props.disabled"
          class="px-4 py-3 bg-[#ACDAC6] text-[#102341] rounded-lg hover:bg-[#9BC7B3] transition-colors flex items-center justify-center flex-1 sm:flex-initial"
          :class="{ 'opacity-50 cursor-not-allowed': props.disabled }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup >
import { ref } from 'vue'

const props = defineProps({
  url: String,
  disabled: {
    type: Boolean,
    default: false
  }
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
