<template>
  <form @submit.prevent class="space-y-6">
    <div :class="{ 'opacity-50 pointer-events-none': !selectedStation }">
      <label class="block text-sm font-medium text-slate-300 mb-3">Pantalla</label>
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-3">
          <div v-for="option in Interfaces.slice(0, 3)" :key="option.key" class="relative">
            <input
              :id="option.key"
              :value="option.key"
              :checked="formData.interfaz === option.key"
              @change="emitFormChange({ interfaz: option.key })"
              type="radio"
              class="sr-only"
            />
            <label
              :for="option.key"
              class="flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-center h-12"
              :class="
                formData.interfaz === option.key
                  ? 'bg-dark-green border-dark-green text-dark-blue'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              "
            >
              <div class="mr-2">
                <DeparturesIcon v-if="option.key === 'departures'" />
                <ArrivalsIcon v-else-if="option.key === 'arrivals'" />
                <PlatformIcon v-else-if="option.key === 'platform'" />
              </div>
              <span class="text-sm font-bold uppercase">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div v-for="option in Interfaces.slice(3, 5)" :key="option.key" class="relative">
            <input
              :id="option.key"
              :value="option.key"
              :checked="formData.interfaz === option.key"
              @change="emitFormChange({ interfaz: option.key })"
              type="radio"
              class="sr-only"
            />
            <label
              :for="option.key"
              class="flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-center h-12"
              :class="
                formData.interfaz === option.key
                  ? 'bg-dark-green border-dark-green text-dark-blue'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              "
            >
              <div class="mr-2">
                <NumberIcon v-if="option.key === 'number'" />
                <ClockIcon v-else-if="option.key === 'clock'" />
              </div>
              <span class="text-sm font-bold uppercase">{{ option.label }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Traffic, Language in one line -->
    <div
      v-if="formData.interfaz !== 'clock' && formData.interfaz !== 'number'"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <!-- Traffic Selection -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-3">Tráfico</label>
        <div class="flex flex-wrap gap-2">
          <div v-for="option in Traffics" :key="option.key">
            <input
              :id="`traffic-${option.key}`"
              :value="option.key"
              :checked="formData.traffic.includes(option.key)"
              @change="
                (e) => {
                  const newTraffic = e.target.checked
                    ? [...formData.traffic, option.key]
                    : formData.traffic.filter((t) => t !== option.key)
                  emitFormChange({ traffic: newTraffic })
                }
              "
              type="checkbox"
              class="sr-only"
            />
            <label
              :for="`traffic-${option.key}`"
              class="inline-flex items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              :class="
                formData.traffic.includes(option.key)
                  ? 'bg-dark-green text-dark-blue'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              "
            >
              {{ option.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Language Selection -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-3">Idiomas</label>
        <div class="flex flex-wrap gap-2">
          <div v-for="option in Languages" :key="option.key">
            <input
              :id="`lang-${option.key}`"
              :value="option.key"
              :checked="formData.languages.includes(option.key)"
              @change="
                (e) => {
                  const newLanguages = e.target.checked
                    ? [...formData.languages, option.key]
                    : formData.languages.filter((l) => l !== option.key)
                  emitFormChange({ languages: newLanguages })
                }
              "
              type="checkbox"
              class="sr-only"
            />
            <label
              :for="`lang-${option.key}`"
              class="inline-flex items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              :class="
                formData.languages.includes(option.key)
                  ? 'bg-dark-green text-dark-blue'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              "
            >
              {{ option.label }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform Filter in its own line -->
    <div
      v-if="formData.interfaz === 'arrivals' || formData.interfaz === 'departures'"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <label class="block text-sm font-medium text-slate-300 mb-3">Vías</label>
      <!-- Show all platforms (available + manually added) -->
      <div v-if="allPlatforms.length > 0" class="flex flex-wrap gap-2">
        <div v-for="platform in allPlatforms" :key="platform">
          <input
            :id="`platform-${platform}`"
            :value="platform"
            :checked="formData.platformFilter.includes(platform)"
            @change="
              (e) => {
                const newPlatformFilter = e.target.checked
                  ? [...formData.platformFilter, platform]
                  : formData.platformFilter.filter((p) => p !== platform)
                emitFormChange({ platformFilter: newPlatformFilter })
              }
            "
            type="checkbox"
            class="sr-only"
          />
          <label
            :for="`platform-${platform}`"
            class="inline-flex items-center px-2 py-1 rounded text-sm cursor-pointer transition-all group"
            :class="
              formData.platformFilter.includes(platform)
                ? 'bg-dark-green text-dark-blue'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            "
          >
            {{ platform }}
            <!-- Show X button for manually added platforms -->
            <button
              v-if="!availablePlatforms.includes(platform)"
              @click.prevent="removePlatform(platform)"
              class="ml-1 opacity-50 hover:opacity-100 w-3 h-3 flex items-center justify-center"
              :class="
                formData.platformFilter.includes(platform) ? 'text-dark-blue' : 'text-slate-300'
              "
            >
              <CloseIcon />
            </button>
          </label>
        </div>
        <!-- Single custom platform input -->
        <div class="flex items-center gap-1">
          <input
            :value="manualPlatform"
            @input="manualPlatform = $event.target.value"
            type="text"
            placeholder="Ej: 1A"
            class="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-dark-green focus:border-dark-green"
            @keyup.enter="addManualPlatform"
          />
          <button
            @click.prevent="addManualPlatform"
            class="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded border border-slate-600 hover:bg-slate-600 transition-colors flex-shrink-0"
          >
            <span class="text-xs">+</span>
          </button>
        </div>
      </div>
      <!-- When no platforms are available at all, show manual input with instructions -->
      <div v-else class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <!-- Display manually added platforms -->
          <div v-for="platform in formData.platformFilter" :key="platform" class="group">
            <div
              class="inline-flex items-center px-2 py-1 rounded text-sm bg-dark-green text-dark-blue"
            >
              {{ platform }}
              <button
                @click.prevent="removePlatform(platform)"
                class="ml-1 text-dark-blue opacity-50 hover:opacity-100 w-4 h-4 flex items-center justify-center"
              >
                <CloseIcon class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Compact manual input -->
          <div class="flex items-center gap-1">
            <input
              :value="manualPlatform"
              @input="manualPlatform = $event.target.value"
              type="text"
              placeholder="Ej: 2, 4"
              class="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-dark-green focus:border-dark-green"
              @keyup.enter="addManualPlatform"
            />
            <button
              @click.prevent="addManualPlatform"
              class="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded border border-slate-600 hover:bg-slate-600 transition-colors flex-shrink-0"
            >
              <span class="text-xs">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estaciones con parada and Línea de cercanías in two columns -->
    <div
      v-if="formData.interfaz === 'arrivals' || formData.interfaz === 'departures'"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <!-- Estaciones con parada Filter -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-3">Estaciones con parada</label>
        <MultiStationFinder
          :model-value="formData.stopFilter"
          @update:model-value="(value) => emitFormChange({ stopFilter: value })"
        />
      </div>

      <!-- Línea de cercanías Filter -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-3"
          >Línea cercanías/rodalies</label
        >
        <div class="flex flex-wrap gap-2">
          <!-- Display manually added custom filters -->
          <div v-for="filter in formData.customFilter" :key="filter" class="group">
            <div
              class="inline-flex items-center px-2 py-1 rounded text-sm bg-dark-green text-dark-blue"
            >
              {{ filter }}
              <button
                @click.prevent="removeCustomFilter(filter)"
                class="ml-1 text-dark-blue opacity-50 hover:opacity-100 w-4 h-4 flex items-center justify-center"
              >
                <CloseIcon class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Compact manual input for new custom filter -->
          <div class="flex items-center gap-1">
            <input
              :value="manualCustomFilter"
              @input="manualCustomFilter = $event.target.value"
              type="text"
              placeholder="Ej: C1, R4"
              class="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-dark-green focus:border-dark-green"
              @keyup.enter="addManualCustomFilter"
            />
            <button
              @click.prevent="addManualCustomFilter"
              class="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded border border-slate-600 hover:bg-slate-600 transition-colors flex-shrink-0"
            >
              <span class="text-xs">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Company and Product Filters with custom widths -->
    <div
      v-if="formData.interfaz === 'arrivals' || formData.interfaz === 'departures'"
      class="grid grid-cols-1 md:grid-cols-3 gap-6"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <!-- Company Filter (33%) -->
      <div class="md:col-span-1">
        <label class="block text-sm font-medium text-slate-300 mb-3">Compañías</label>
        <div class="flex flex-wrap gap-2">
          <div v-for="company in Companies" :key="company.key">
            <input
              :id="`company-${company.key}`"
              :value="company.key"
              :checked="formData.companyFilter.includes(company.key)"
              @change="
                (e) => {
                  const newCompanyFilter = e.target.checked
                    ? [...formData.companyFilter, company.key]
                    : formData.companyFilter.filter((c) => c !== company.key)
                  emitFormChange({ companyFilter: newCompanyFilter })
                }
              "
              type="checkbox"
              class="sr-only"
            />
            <label
              :for="`company-${company.key}`"
              class="inline-flex items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              :class="
                formData.companyFilter.includes(company.key)
                  ? 'bg-dark-green text-dark-blue'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              "
            >
              {{ company.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Product Filter (66%) -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-slate-300 mb-3">Productos</label>
        <div class="flex flex-wrap gap-2">
          <div v-for="product in Products" :key="product.key">
            <input
              :id="`product-${product.key}`"
              :value="product.key"
              :checked="formData.productFilter.includes(product.key)"
              @change="
                (e) => {
                  const newProductFilter = e.target.checked
                    ? [...formData.productFilter, product.key]
                    : formData.productFilter.filter((p) => p !== product.key)
                  emitFormChange({ productFilter: newProductFilter })
                }
              "
              type="checkbox"
              class="sr-only"
            />
            <label
              :for="`product-${product.key}`"
              class="inline-flex items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              :class="
                formData.productFilter.includes(product.key)
                  ? 'bg-dark-green text-dark-blue'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              "
            >
              {{ product.label }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Conditional Fields for Arrivals/Departures -->
    <div
      v-if="formData.interfaz === 'arrivals' || formData.interfaz === 'departures'"
      class="space-y-6"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <div
        class="flex flex-wrap gap-3"
        :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
      >
        <div v-for="option in VisualizationOptions" :key="option.key" class="relative">
          <input
            :id="option.key"
            :checked="formData[option.key]"
            @change="(e) => emitFormChange({ [option.key]: e.target.checked })"
            type="checkbox"
            class="sr-only"
          />
          <label
            :for="option.key"
            class="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
            :class="
              formData[option.key]
                ? 'bg-slate-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            "
          >
            <div
              class="w-3 h-3 rounded border mr-2 flex items-center justify-center"
              :class="formData[option.key] ? 'border-white bg-white' : 'border-slate-400'"
            >
              <CheckmarkIcon v-if="formData[option.key]" />
            </div>
            {{ option.label }}
          </label>
        </div>
      </div>

      <!-- Subtitle -->
      <div :class="{ 'opacity-50 pointer-events-none': !selectedStation }">
        <label class="block text-sm font-medium text-slate-300 mb-2">Subtítulo</label>
        <div class="grid gap-2 grid-cols-1 md:grid-cols-2">
          <select
            :value="formData.subtitle"
            @change="(e) => emitFormChange({ subtitle: e.target.value })"
            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green text-white"
          >
            <option value="">Seleccionar subtítulo</option>
            <option v-for="subtitle in SubtitlesList" :key="subtitle.key" :value="subtitle.key">
              {{ subtitle.label }}
            </option>
          </select>
          <input
            v-show="subtitleTakesParam"
            :value="formData.subtitleParam"
            @input="(e) => emitFormChange({ subtitleParam: e.target.value })"
            type="text"
            :placeholder="
              formData.subtitle === 'operador:$' ? 'Nombre del operador' : 'Número de vía'
            "
            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green text-white placeholder-slate-400"
          />
        </div>
      </div>
    </div>

    <!-- Conditional Fields for Platform -->
    <div
      v-if="formData.interfaz === 'platform'"
      class="space-y-6"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-3">Vías</label>
        <!-- Show all platforms (available + manually added) -->
        <div v-if="allPlatformLocations.length > 0" class="flex flex-wrap gap-2">
          <div v-for="platform in allPlatformLocations" :key="platform">
            <input
              :id="`platform-loc-${platform}`"
              :value="platform"
              :checked="formData.platformLocations.includes(platform)"
              @change="
                (e) => {
                  const newPlatformLocations = e.target.checked
                    ? [...formData.platformLocations, platform]
                    : formData.platformLocations.filter((p) => p !== platform)
                  emitFormChange({ platformLocations: newPlatformLocations })
                }
              "
              type="checkbox"
              class="sr-only"
            />
            <label
              :for="`platform-loc-${platform}`"
              class="inline-flex items-center px-2 py-1 rounded text-sm cursor-pointer transition-all group"
              :class="
                formData.platformLocations.includes(platform)
                  ? 'bg-dark-green text-dark-blue'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              "
            >
              {{ platform }}
              <!-- Show X button for manually added platforms -->
              <button
                v-if="!availablePlatforms.includes(platform)"
                @click.prevent="removePlatformLocation(platform)"
                class="ml-1 opacity-50 hover:opacity-100 w-3 h-3 flex items-center justify-center"
                :class="
                  formData.platformLocations.includes(platform)
                    ? 'text-dark-blue'
                    : 'text-slate-300'
                "
              >
                <CloseIcon />
              </button>
            </label>
          </div>
          <!-- Single custom platform input -->
          <div class="flex items-center gap-1">
            <input
              :value="manualPlatform"
              @input="manualPlatform = $event.target.value"
              type="text"
              placeholder="Ej: 1A"
              class="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-dark-green focus:border-dark-green"
              @keyup.enter="addManualPlatformLocation"
            />
            <button
              @click.prevent="addManualPlatformLocation"
              class="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded border border-slate-600 hover:bg-slate-600 transition-colors flex-shrink-0"
            >
              <span class="text-xs">+</span>
            </button>
          </div>
        </div>
        <!-- When no platforms are available at all, show manual input with instructions -->
        <div v-else class="space-y-3">
          <p class="text-sm text-slate-400">No hay información de vías. Introduce manualmente:</p>
          <div class="flex flex-wrap gap-2">
            <!-- Display manually added platforms -->
            <div v-for="platform in formData.platformLocations" :key="platform" class="group">
              <div
                class="inline-flex items-center px-2 py-1 rounded text-sm bg-dark-green text-dark-blue"
              >
                {{ platform }}
                <button
                  @click.prevent="removePlatformLocation(platform)"
                  class="ml-1 text-dark-blue opacity-50 hover:opacity-100 w-4 h-4 flex items-center justify-center"
                >
                  <CloseIcon class="h-3 w-3" />
                </button>
              </div>
            </div>

            <!-- Compact manual input -->
            <div class="flex items-center gap-1">
              <input
                :value="manualPlatform"
                @input="manualPlatform = $event.target.value"
                type="text"
                placeholder="Ej: 1A"
                class="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-dark-green focus:border-dark-green"
                @keyup.enter="addManualPlatformLocation"
              />
              <button
                @click.prevent="addManualPlatformLocation"
                class="px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded border border-slate-600 hover:bg-slate-600 transition-colors flex-shrink-0"
              >
                <span class="text-xs">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Modo de andén</label>
          <select
            :value="formData.platformMode"
            @change="(e) => emitFormChange({ platformMode: e.target.value })"
            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green text-white"
          >
            <option v-for="mode in PlatformModes" :key="mode.key" :value="mode.value">
              {{ mode.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Trigger de andén</label>
          <select
            :value="formData.platformTrigger"
            @change="(e) => emitFormChange({ platformTrigger: e.target.value })"
            class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green text-white"
          >
            <option
              v-for="trigger in PlatformTriggerList"
              :key="trigger.key"
              :value="trigger.value"
            >
              {{ trigger.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- <div class="flex flex-wrap gap-3">
        <div v-for="option in PlatformBooleanOptions" :key="option.key" class="relative">
          <input
            :id="option.key"
            :checked="formData[option.key]"
            @change="(e) => emitFormChange({ [option.key]: e.target.checked })"
            type="checkbox"
            class="sr-only"
          />
          <label
            :for="option.key"
            class="flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
            :class="
              formData[option.key]
                ? 'bg-slate-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            "
          >
            <div
              class="w-3 h-3 rounded border mr-2 flex items-center justify-center"
              :class="formData[option.key] ? 'border-white bg-white' : 'border-slate-400'"
            >
              <CheckmarkIcon v-if="formData[option.key]" />
            </div>
            {{ option.label }}
          </label>
        </div>
      </div> -->
    </div>

    <!-- Conditional Fields for Number -->
    <div
      v-if="formData.interfaz === 'number'"
      class="space-y-6"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Número a mostrar</label>
        <input
          :value="formData.displayNumber"
          @input="(e) => emitFormChange({ displayNumber: e.target.value })"
          class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green text-white"
        />
      </div>
    </div>

    <div
      v-if="formData.interfaz !== 'number' && formData.interfaz !== 'clock'"
      :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
    >
      <label class="block text-sm font-medium text-slate-300 mb-3">Tamaño de fuente</label>
      <div class="flex items-center gap-4 mb-3">
        <div class="w-1/2">
          <input
            :value="formData.fontSize"
            @input="(e) => emitFormChange({ fontSize: parseInt(e.target.value) })"
            type="range"
            min="1"
            max="3"
            step="1"
            class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
      <div class="flex justify-between text-xs text-slate-400 mt-1 w-1/2">
        <span>Pequeño</span>
        <span>Mediano</span>
        <span>Grande</span>
      </div>
    </div>
  </form>
</template>

<script setup>
import { computed, ref } from 'vue'
import DeparturesIcon from './icons/DeparturesIcon.vue'
import ArrivalsIcon from './icons/ArrivalsIcon.vue'
import PlatformIcon from './icons/PlatformIcon.vue'
import NumberIcon from './icons/NumberIcon.vue'
import ClockIcon from './icons/ClockIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'
import CheckmarkIcon from './icons/CheckmarkIcon.vue'
import MultiStationFinder from './MultiStationFinder.vue'
import {
  Interfaces,
  Traffics,
  Languages,
  Companies,
  SubtitlesList,
  PlatformModes,
  PlatformTriggerList,
  Products,
  VisualizationOptions,
  PlatformBooleanOptions,
} from '../constants'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
  selectedStation: {
    type: Object,
    default: null,
  },
  adifData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['form-change'])

// Local state for manual platform input
const manualPlatform = ref('')

// Local state for manual custom filter input
const manualCustomFilter = ref('')

// Computed properties for platforms
const availablePlatforms = computed(() => {
  const platforms = Object.keys(props.adifData?.station_settings?.platforms || {})
  return platforms.sort((a, b) => {
    // Try to sort numerically first
    const numA = parseInt(a, 10)
    const numB = parseInt(b, 10)

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }

    // Fall back to string comparison
    return a.localeCompare(b)
  })
})

const allPlatforms = computed(() => {
  const available = availablePlatforms.value
  const manual = props.formData.platformFilter.filter((p) => !available.includes(p))
  return [...available, ...manual].sort((a, b) => {
    // Try to sort numerically first
    const numA = parseInt(a, 10)
    const numB = parseInt(b, 10)

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }

    // Fall back to string comparison
    return a.localeCompare(b)
  })
})

const allPlatformLocations = computed(() => {
  const available = availablePlatforms.value
  const manual = props.formData.platformLocations.filter((p) => !available.includes(p))
  return [...available, ...manual].sort((a, b) => {
    // Try to sort numerically first
    const numA = parseInt(a, 10)
    const numB = parseInt(b, 10)

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }

    // Fall back to string comparison
    return a.localeCompare(b)
  })
})

// Check if subtitle takes parameter
const subtitleTakesParam = computed(() => {
  const subtitle = SubtitlesList.find((s) => s.key === props.formData.subtitle)
  return subtitle?.takesParam || false
})

// Helper function to emit form changes
const emitFormChange = (updates) => {
  emit('form-change', { ...props.formData, ...updates })
}

// Platform management methods
const addManualPlatform = () => {
  if (!manualPlatform.value.trim()) return

  const platform = manualPlatform.value.trim()
  if (!props.formData.platformFilter.includes(platform)) {
    emitFormChange({
      platformFilter: [...props.formData.platformFilter, platform],
    })
  }

  // Clear input after adding
  manualPlatform.value = ''
}

const removePlatform = (platform) => {
  const newPlatformFilter = props.formData.platformFilter.filter((p) => p !== platform)
  emitFormChange({ platformFilter: newPlatformFilter })
}

const addManualPlatformLocation = () => {
  if (!manualPlatform.value.trim()) return

  const platform = manualPlatform.value.trim()
  if (!props.formData.platformLocations.includes(platform)) {
    emitFormChange({
      platformLocations: [...props.formData.platformLocations, platform],
    })
  }

  // Clear input after adding
  manualPlatform.value = ''
}

const removePlatformLocation = (platform) => {
  const newPlatformLocations = props.formData.platformLocations.filter((p) => p !== platform)
  emitFormChange({ platformLocations: newPlatformLocations })
}

// Custom filter management methods
const addManualCustomFilter = () => {
  if (!manualCustomFilter.value.trim()) return

  const filter = manualCustomFilter.value.trim()
  if (!props.formData.customFilter.includes(filter)) {
    emitFormChange({
      customFilter: [...props.formData.customFilter, filter],
    })
  }

  // Clear input after adding
  manualCustomFilter.value = ''
}

const removeCustomFilter = (filter) => {
  const newCustomFilter = props.formData.customFilter.filter((f) => f !== filter)
  emitFormChange({ customFilter: newCustomFilter })
}
</script>

<style scoped>
/* Custom range slider styles */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--color-dark-green);
  cursor: pointer;
  border: 2px solid var(--color-light-green);
}

.slider::-moz-range-thumb {
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--color-dark-green);
  cursor: pointer;
  border: 2px solid var(--color-light-green);
}

.slider::-webkit-slider-track {
  background: var(--color-slate-600, #475569);
  border-radius: 5px;
}

.slider::-moz-range-track {
  background: var(--color-slate-600, #475569);
  border-radius: 5px;
}
</style>
