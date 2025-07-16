<template>
  <div class="resizable-wrapper">
    <div class="flex justify-center w-full">
      <div
        ref="resizableContainer"
        class="relative overflow-hidden rounded-lg border border-slate-600 w-full"
        :class="
          resizableStyle.width || resizableStyle.height
            ? ''
            : isPortrait
              ? 'aspect-[9/16]'
              : 'aspect-[16/9]'
        "
        :style="resizableStyle"
      >
        <!-- Slot for any component -->
        <div
          class="w-full h-full relative z-0"
          :style="{ pointerEvents: isResizing ? 'none' : 'auto' }"
        >
          <slot />
        </div>

        <!-- Invisible resize areas near borders/corners -->
        <div class="absolute inset-0 pointer-events-none z-50">
          <!-- Bottom corners for diagonal resize -->
          <div
            class="absolute bottom-0 left-0 w-5 h-5 cursor-sw-resize pointer-events-auto"
            @mousedown="startResize('sw', $event)"
          ></div>
          <div
            class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize pointer-events-auto"
            @mousedown="startResize('se', $event)"
          ></div>

          <!-- Edge areas (5px wide/tall strips) - only bottom, left, right -->
          <div
            class="absolute bottom-0 left-5 right-5 h-1 cursor-s-resize pointer-events-auto"
            @mousedown="startResize('s', $event)"
          ></div>
          <div
            class="absolute left-0 top-5 bottom-5 w-1 cursor-w-resize pointer-events-auto"
            @mousedown="startResize('w', $event)"
          ></div>
          <div
            class="absolute right-0 top-5 bottom-5 w-1 cursor-e-resize pointer-events-auto"
            @mousedown="startResize('e', $event)"
          ></div>
        </div>
      </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DesktopIcon from './icons/DesktopIcon.vue'
import MobileIcon from './icons/MobileIcon.vue'

// No props needed - this is a generic wrapper

// Component state
const isPortrait = ref(false)
const resizableContainer = ref(null)
const isResizing = ref(false)
const resizableStyle = ref({})
const resizeData = ref({
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
  direction: '',
  maxWidth: 0,
})

// Set default to full width 16:9 on mount
onMounted(() => {
  isPortrait.value = false
  isResizing.value = false
  resizableStyle.value = {}
})

// Toggle aspect ratio
const toggleAspectRatio = () => {
  // Check if component has been manually resized
  const hasManualSize = resizableStyle.value.width || resizableStyle.value.height

  if (hasManualSize) {
    // First click: reset to current aspect ratio (clear manual sizing)
    resizableStyle.value = {}
    isResizing.value = false
  } else {
    // Second click or initial click: toggle aspect ratio
    isPortrait.value = !isPortrait.value
    isResizing.value = false
    resizableStyle.value = {}
  }
}

// Resize functionality
const startResize = (direction, event) => {
  event.preventDefault()
  event.stopPropagation()

  const container = resizableContainer.value
  const parent = container.parentElement
  const rect = container.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()

  isResizing.value = true

  // Prevent iframe from capturing mouse events
  document.body.style.userSelect = 'none'

  resizeData.value = {
    startX: event.clientX,
    startY: event.clientY,
    startWidth: rect.width,
    startHeight: rect.height,
    direction,
    maxWidth: parentRect.width - 40, // Account for padding and margins
  }

  // Set initial size immediately with centering
  resizableStyle.value = {
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    marginLeft: 'auto',
    marginRight: 'auto',
  }

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (event) => {
  if (!isResizing.value) return

  const deltaX = event.clientX - resizeData.value.startX
  const deltaY = event.clientY - resizeData.value.startY
  const direction = resizeData.value.direction

  let newWidth = resizeData.value.startWidth
  let newHeight = resizeData.value.startHeight

  // Calculate new dimensions with parent width constraint
  if (direction.includes('e')) {
    newWidth = Math.min(
      resizeData.value.maxWidth,
      Math.max(200, resizeData.value.startWidth + deltaX),
    )
  }
  if (direction.includes('w')) {
    newWidth = Math.min(
      resizeData.value.maxWidth,
      Math.max(200, resizeData.value.startWidth - deltaX),
    )
  }
  if (direction.includes('s')) {
    newHeight = Math.max(150, resizeData.value.startHeight + deltaY)
  }

  // Style object with consistent centering
  const styleObj = {
    width: `${newWidth}px`,
    height: `${newHeight}px`,
    marginLeft: 'auto',
    marginRight: 'auto',
  }

  // Use requestAnimationFrame for smoother updates
  requestAnimationFrame(() => {
    resizableStyle.value = styleObj
  })
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.resizable-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.resizable-wrapper > .flex:first-child {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Ensure cursor changes work properly */
.cursor-crosshair {
  cursor: crosshair !important;
}

/* Ensure handles are always visible */
.resizable-wrapper * {
  box-sizing: border-box;
}

/* Prevent iframe from interfering with resize */
.resizable-wrapper iframe {
  pointer-events: auto;
}
</style>
