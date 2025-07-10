<template>
  <div class="min-h-screen bg-slate-900 p-6">
    <div class="max-w-7xl mx-auto">
      <div
        class="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-3 space-y-3 sm:space-y-0 mb-8"
      >
        <div class="w-24 sm:w-30 h-12 sm:h-16 flex items-center justify-center flex-shrink-0 mr-4">
          <Adif class="adif-logo w-full h-full" />
        </div>
        <div class="text-center sm:text-left">
          <h1 class="text-2xl font-bold text-white leading-tight">Pantallas estaciones ADIF</h1>
          <p class="text-slate-400 text-md mt-1">Configurador de modos</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Panel - Form -->
        <div class="bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-700">
          <form @submit.prevent class="space-y-6">
            <!-- Station Selection -->
            <StationFinder
              v-model="formData.estacion"
              @station-selected="handleStationSelected"
              @station-cleared="handleStationCleared"
            />

            <!-- Station Info Display -->
            <StationInfo :selected-station="selectedStation" :adif-data="adifData" />

            <!-- Interface Selection -->
            <div :class="{ 'opacity-50 pointer-events-none': !selectedStation }">
              <label class="block text-sm font-medium text-slate-300 mb-3">Pantalla</label>
              <div class="grid grid-cols-1 gap-3">
                <!-- First row: Salidas, Llegadas -->
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="option in Interfaces.slice(0, 2)" :key="option.key" class="relative">
                    <input
                      :id="option.key"
                      v-model="formData.interfaz"
                      :value="option.key"
                      type="radio"
                      class="sr-only"
                    />
                    <label
                      :for="option.key"
                      class="flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-center"
                      :class="
                        formData.interfaz === option.key
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      "
                    >
                      <div
                        class="w-3 h-3 rounded-full border-2 mr-2 flex items-center justify-center flex-shrink-0"
                        :class="
                          formData.interfaz === option.key ? 'border-white' : 'border-slate-400'
                        "
                      >
                        <div
                          v-if="formData.interfaz === option.key"
                          class="w-1.5 h-1.5 rounded-full bg-white"
                        ></div>
                      </div>
                      <span class="text-sm">{{ option.label }}</span>
                    </label>
                  </div>
                </div>

                <!-- Second row: Vía, Número, Reloj -->
                <div class="grid grid-cols-3 gap-2">
                  <div v-for="option in Interfaces.slice(2, 5)" :key="option.key" class="relative">
                    <input
                      :id="option.key"
                      v-model="formData.interfaz"
                      :value="option.key"
                      type="radio"
                      class="sr-only"
                    />
                    <label
                      :for="option.key"
                      class="flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-center"
                      :class="
                        formData.interfaz === option.key
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      "
                    >
                      <div
                        class="w-3 h-3 rounded-full border-2 mr-2 flex items-center justify-center flex-shrink-0"
                        :class="
                          formData.interfaz === option.key ? 'border-white' : 'border-slate-400'
                        "
                      >
                        <div
                          v-if="formData.interfaz === option.key"
                          class="w-1.5 h-1.5 rounded-full bg-white"
                        ></div>
                      </div>
                      <span class="text-sm">{{ option.label }}</span>
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
                      v-model="formData.traffic"
                      :value="option.key"
                      type="checkbox"
                      class="sr-only"
                    />
                    <label
                      :for="`traffic-${option.key}`"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
                      :class="
                        formData.traffic.includes(option.key)
                          ? 'bg-blue-600 text-white'
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
                      v-model="formData.language"
                      :value="option.key"
                      type="checkbox"
                      class="sr-only"
                    />
                    <label
                      :for="`lang-${option.key}`"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
                      :class="
                        formData.language.includes(option.key)
                          ? 'bg-blue-600 text-white'
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
              <!-- When platforms are available, show checkboxes -->
              <div v-if="availablePlatforms.length > 0" class="flex flex-wrap gap-2">
                <div v-for="platform in availablePlatforms" :key="platform">
                  <input
                    :id="`platform-${platform}`"
                    v-model="formData.platformFilter"
                    :value="platform"
                    type="checkbox"
                    class="sr-only"
                  />
                  <label
                    :for="`platform-${platform}`"
                    class="inline-flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
                    :class="
                      formData.platformFilter.includes(platform)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    "
                  >
                    {{ platform }}
                  </label>
                </div>
              </div>
              <!-- When no platforms are available, show manual input -->
              <div v-else class="space-y-3">
                <p class="text-sm text-slate-400">
                  No hay información de vías. Introduce manualmente:
                </p>
                <div class="flex items-center gap-2">
                  <input
                    v-model="manualPlatform"
                    type="text"
                    placeholder="Ej: 1,2,3 o 1-5"
                    class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-400"
                  />
                  <button
                    @click.prevent="addManualPlatform"
                    class="px-3 py-2 bg-slate-700 text-slate-300 text-sm rounded-md border border-slate-600 hover:bg-slate-600 transition-colors flex-shrink-0"
                  >
                    <span>+</span>
                  </button>
                </div>
                <!-- Display manually added platforms -->
                <div v-if="formData.platformFilter.length > 0" class="flex flex-wrap gap-2 mt-3">
                  <div v-for="platform in formData.platformFilter" :key="platform" class="group">
                    <div
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-blue-600 text-white"
                    >
                      {{ platform }}
                      <button
                        @click.prevent="removePlatform(platform)"
                        class="ml-1 text-white opacity-50 hover:opacity-100 w-4 h-4 flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                          />
                        </svg>
                      </button>
                    </div>
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
              <!-- Product Filter -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-3">Productos</label>
                <div class="flex flex-wrap gap-2">
                  <div v-for="product in Products" :key="product.key">
                    <input
                      :id="`product-${product.key}`"
                      v-model="formData.productFilter"
                      :value="product.key"
                      type="checkbox"
                      class="sr-only"
                    />
                    <label
                      :for="`product-${product.key}`"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
                      :class="
                        formData.productFilter.includes(product.key)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      "
                    >
                      {{ product.label }}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Company Filter -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-3">Compañías</label>
                <div class="flex flex-wrap gap-2">
                  <div v-for="company in Companies" :key="company.key">
                    <input
                      :id="`company-${company.key}`"
                      v-model="formData.companyFilter"
                      :value="company.key"
                      type="checkbox"
                      class="sr-only"
                    />
                    <label
                      :for="`company-${company.key}`"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
                      :class="
                        formData.companyFilter.includes(company.key)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      "
                    >
                      {{ company.label }}
                    </label>
                  </div>
                </div>
              </div>

              <div
                class="flex flex-wrap gap-3"
                :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
              >
                <div v-for="option in VisualizationOptions" :key="option.key" class="relative">
                  <input
                    :id="option.key"
                    v-model="formData[option.key]"
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
                      <svg
                        v-if="formData[option.key]"
                        class="w-2 h-2 text-slate-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    {{ option.label }}
                  </label>
                </div>
              </div>

              <!-- Subtitle -->
              <div :class="{ 'opacity-50 pointer-events-none': !selectedStation }">
                <label class="block text-sm font-medium text-slate-300 mb-2">Subtítulo</label>
                <div
                  class="grid gap-3"
                  :class="
                    subtitleTakesParam ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
                  "
                >
                  <select
                    v-model="formData.subtitle"
                    class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  >
                    <option value="">Seleccionar subtítulo</option>
                    <option
                      v-for="subtitle in SubtitlesList"
                      :key="subtitle.key"
                      :value="subtitle.key"
                    >
                      {{ subtitle.label }}
                    </option>
                  </select>
                  <div v-if="!subtitleTakesParam" class="hidden md:block"></div>
                  <input
                    v-if="subtitleTakesParam"
                    v-model="formData.subtitleParam"
                    type="text"
                    :placeholder="
                      formData.subtitle === 'operador:$' ? 'Nombre del operador' : 'Número de vía'
                    "
                    class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-400"
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
                <!-- When platforms are available, show checkboxes -->
                <div v-if="availablePlatforms.length > 0" class="flex flex-wrap gap-2">
                  <div v-for="platform in availablePlatforms" :key="platform">
                    <input
                      :id="`platform-loc-${platform}`"
                      v-model="formData.platformLocations"
                      :value="platform"
                      type="checkbox"
                      class="sr-only"
                    />
                    <label
                      :for="`platform-loc-${platform}`"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
                      :class="
                        formData.platformLocations.includes(platform)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      "
                    >
                      {{ platform }}
                    </label>
                  </div>
                </div>
                <!-- When no platforms are available, show manual input -->
                <div v-else class="space-y-3">
                  <p class="text-sm text-slate-400">
                    No hay información de vías. Introduce manualmente:
                  </p>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="manualPlatform"
                      type="text"
                      placeholder="Ej: 1,2,3 o 1-5"
                      class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-400"
                    />
                    <button
                      @click.prevent="addManualPlatformLocation"
                      class="px-3 py-2 bg-slate-700 text-slate-300 text-sm rounded-md border border-slate-600 hover:bg-slate-600 transition-colors flex-shrink-0"
                    >
                      <span>+</span>
                    </button>
                  </div>
                  <!-- Display manually added platforms -->
                  <div
                    v-if="formData.platformLocations.length > 0"
                    class="flex flex-wrap gap-2 mt-3"
                  >
                    <div
                      v-for="platform in formData.platformLocations"
                      :key="platform"
                      class="group"
                    >
                      <div
                        class="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-blue-600 text-white"
                      >
                        {{ platform }}
                        <button
                          @click.prevent="removePlatformLocation(platform)"
                          class="ml-1 text-white opacity-50 hover:opacity-100 w-4 h-4 flex items-center justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Modo de andén</label>
                  <select
                    v-model="formData.platformMode"
                    class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  >
                    <option v-for="mode in PlatformModes" :key="mode.key" :value="mode.value">
                      {{ mode.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2"
                    >Trigger de andén</label
                  >
                  <select
                    v-model="formData.platformTrigger"
                    class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
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

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2"
                    >Disposición del andén</label
                  >
                  <select
                    v-model="formData.platformArrangement"
                    class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  >
                    <option
                      v-for="arrangement in PlatformArrangements"
                      :key="arrangement.key"
                      :value="arrangement.value"
                    >
                      {{ arrangement.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <div v-for="option in PlatformBooleanOptions" :key="option.key" class="relative">
                  <input
                    :id="option.key"
                    v-model="formData[option.key]"
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
                      <svg
                        v-if="formData[option.key]"
                        class="w-2 h-2 text-slate-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    {{ option.label }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Conditional Fields for Number -->
            <div
              v-if="formData.interfaz === 'number'"
              class="space-y-4"
              :class="{ 'opacity-50 pointer-events-none': !selectedStation }"
            >
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2"
                  >Número a mostrar</label
                >
                <input
                  v-model="formData.displayNumber"
                  type="number"
                  min="0"
                  max="99"
                  class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
            </div>
          </form>
        </div>

        <!-- Right Panel - Preview -->
        <div class="space-y-6">
          <div class="bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-700">
            <!-- Gravita Component Container -->
            <div
              class="transition-all duration-700 ease-in-out overflow-hidden rounded-s"
              :class="isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]'"
            >
              <Gravita class="gravita w-full h-full" v-bind="gravitaProps" @data="handledata" />
            </div>

            <!-- Aspect Ratio Toggle Button - Left Aligned -->
            <div class="flex justify-start mt-4">
              <button
                @click="toggleAspectRatio"
                class="px-2 py-1 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors flex items-center space-x-1.5 border border-slate-600 text-xs"
              >
                <!-- Desktop/Landscape Icon -->
                <svg
                  v-if="isPortrait"
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" ry="2" stroke-width="2" />
                  <circle cx="7" cy="12" r="1" fill="currentColor" />
                </svg>
                <!-- Mobile/Portrait Icon -->
                <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="7" y="2" width="10" height="20" rx="2" ry="2" stroke-width="2" />
                  <circle cx="12" cy="18" r="1" fill="currentColor" />
                </svg>
                <span>{{ isPortrait ? '16:9' : '9:16' }}</span>
              </button>
            </div>
          </div>

          <!-- URL Sharing -->
          <div :class="{ 'opacity-50 pointer-events-none': !selectedStation }">
            <UrlSharing :url="generatedUrl" :disabled="!selectedStation" />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="mt-12 text-center text-slate-500 text-xs">
        <div class="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="flex items-center gap-2">
            <span>por</span>
            <a
              href="https://x.com/mariomnts"
              target="_blank"
              class="hover:text-slate-400 transition-colors"
              >Mario Montes</a
            >
          </div>
          <span class="hidden sm:inline">•</span>
          <div>Propósito educacional. Sin afiliación con Adif</div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Adif from '../components/Adif.vue'
import Gravita from '../components/Gravita.vue'
import StationFinder from '../components/StationFinder.vue'
import StationInfo from '../components/StationInfo.vue'
import UrlSharing from '../components/UrlSharing.vue'
import { convertFormDataToGravitaProps, generateUrl } from '../utils/format'
import {
  Interfaces,
  Traffics,
  Languages,
  Companies,
  SubtitlesList,
  PlatformModes,
  PlatformTriggerList,
  PlatformArrangements,
  Products,
  VisualizationOptions,
  PlatformBooleanOptions,
} from '../constants'

// Form data
const formData = ref({
  interfaz: 'departures',
  stationCode: '',
  traffic: [], // Default none selected in UI
  language: ['es'], // Default Spanish
  showHeader: true,
  showAccess: false,
  showPlatform: true,
  showProduct: true,
  showNumber: true,
  countdown: true,
  platformFilter: [], // Default none
  productFilter: [], // Changed from productFilter
  companyFilter: [], // Changed from companyFilter
  subtitle: '',
  subtitleParam: '',
  platformLocations: [],
  displayNumber: '',
  platformMode: 'platform',
  platformTrigger: 'next',
  showComposition: true,
  showObservation: true,
  platformArrangement: 'ascending',
})

// Component state
const selectedStation = ref(null)
const adifData = ref(null)
const isPortrait = ref(false)
const manualPlatform = ref('')

const availablePlatforms = computed(() => {
  return Object.keys(adifData.value?.station_settings?.platforms || {})
})

// Check if subtitle takes parameter
const subtitleTakesParam = computed(() => {
  const subtitle = SubtitlesList.find((s) => s.key === formData.value.subtitle)
  return subtitle?.takesParam || false
})

// Toggle aspect ratio
const toggleAspectRatio = () => {
  isPortrait.value = !isPortrait.value
}

// Station handlers
const handleStationSelected = (station) => {
  selectedStation.value = station
  formData.value.stationCode = station.code
}

const handleStationCleared = () => {
  selectedStation.value = null
  adifData.value = null
  formData.value.stationCode = ''
}

const handledata = (data) => {
  adifData.value = data
}

// Platform management methods
const addManualPlatform = () => {
  if (!manualPlatform.value.trim()) return

  // Handle comma-separated values
  if (manualPlatform.value.includes(',')) {
    const platforms = manualPlatform.value
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p)
    platforms.forEach((platform) => {
      if (!formData.value.platformFilter.includes(platform)) {
        formData.value.platformFilter.push(platform)
      }
    })
  }
  // Handle range syntax (e.g., 1-5)
  else if (manualPlatform.value.includes('-')) {
    const [start, end] = manualPlatform.value.split('-').map((p) => parseInt(p.trim(), 10))
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      for (let i = start; i <= end; i++) {
        const platform = i.toString()
        if (!formData.value.platformFilter.includes(platform)) {
          formData.value.platformFilter.push(platform)
        }
      }
    }
  }
  // Handle single value
  else {
    const platform = manualPlatform.value.trim()
    if (!formData.value.platformFilter.includes(platform)) {
      formData.value.platformFilter.push(platform)
    }
  }

  // Clear input after adding
  manualPlatform.value = ''
}

const removePlatform = (platform) => {
  const index = formData.value.platformFilter.indexOf(platform)
  if (index !== -1) {
    formData.value.platformFilter.splice(index, 1)
  }
}

const addManualPlatformLocation = () => {
  if (!manualPlatform.value.trim()) return

  // Handle comma-separated values
  if (manualPlatform.value.includes(',')) {
    const platforms = manualPlatform.value
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p)
    platforms.forEach((platform) => {
      if (!formData.value.platformLocations.includes(platform)) {
        formData.value.platformLocations.push(platform)
      }
    })
  }
  // Handle range syntax (e.g., 1-5)
  else if (manualPlatform.value.includes('-')) {
    const [start, end] = manualPlatform.value.split('-').map((p) => parseInt(p.trim(), 10))
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      for (let i = start; i <= end; i++) {
        const platform = i.toString()
        if (!formData.value.platformLocations.includes(platform)) {
          formData.value.platformLocations.push(platform)
        }
      }
    }
  }
  // Handle single value
  else {
    const platform = manualPlatform.value.trim()
    if (!formData.value.platformLocations.includes(platform)) {
      formData.value.platformLocations.push(platform)
    }
  }

  // Clear input after adding
  manualPlatform.value = ''
}

const removePlatformLocation = (platform) => {
  const index = formData.value.platformLocations.indexOf(platform)
  if (index !== -1) {
    formData.value.platformLocations.splice(index, 1)
  }
}

// Computed props for Gravita component
const gravitaProps = computed(() => {
  return convertFormDataToGravitaProps(formData.value)
})

// URL generation
const generatedUrl = computed(() => {
  // Only generate URL if a station is selected
  if (!selectedStation.value) return 'Selecciona una estación...'
  return generateUrl(formData.value, selectedStation.value)
})

watch(
  formData,
  () => {
    window?.gtag?.('event', 'generation', {
      ...formData.value,
    })
  },
  { deep: true },
)
</script>

<style scoped>
.gravita {
  background: var(--adif-blue);
}

.adif-logo {
  fill: var(--adif-light-green);
}
</style>
