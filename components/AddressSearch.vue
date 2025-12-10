<template>
  <div class="address-search-wrapper">
    <input
      v-model="query"
      type="text"
      :placeholder="placeholder"
      class="address-input"
      @input="onInput"
      @focus="showSuggestions = true"
      @blur="onBlur"
    />
    <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        class="suggestion-item"
        @mousedown.prevent="selectSuggestion(suggestion)"
      >
        {{ suggestion.value }}
      </div>
    </div>
    <div v-if="loading" class="loading-indicator">Загрузка...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  dadataToken: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Введите адрес'
  }
})

const emit = defineEmits(['address-selected'])

const query = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
const loading = ref(false)

let timeoutId = null

async function onInput() {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  if (query.value.length < 3) {
    suggestions.value = []
    return
  }

  timeoutId = setTimeout(async () => {
    await fetchSuggestions()
  }, 300)
}

async function fetchSuggestions() {
  if (!query.value || query.value.length < 3) {
    suggestions.value = []
    return
  }

  loading.value = true

  try {
    const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${props.dadataToken}`
      },
      body: JSON.stringify({
        query: query.value,
        count: 10
      })
    })

    if (!response.ok) {
      console.error('DaData API error:', response.status)
      suggestions.value = []
      return
    }

    const data = await response.json()

    suggestions.value = (data.suggestions || [])
      .filter(s => s.data.geo_lat && s.data.geo_lon)

  } catch (error) {
    console.error('DaData search error:', error)
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

function selectSuggestion(suggestion) {
  query.value = suggestion.value
  showSuggestions.value = false

  emit('address-selected', {
    lat: parseFloat(suggestion.data.geo_lat),
    lng: parseFloat(suggestion.data.geo_lon),
    label: suggestion.value,
    data: suggestion
  })
}

function onBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}
</script>

<style scoped>
.address-search-wrapper {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  width: 350px;
}

.address-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 14px;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s;
}

.address-input:focus {
  outline: none;
  border-color: #0066cc;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1001;
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.15s;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.loading-indicator {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
