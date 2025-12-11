<template>
  <div class="object-search">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Поиск объектов (ID или название)..."
      class="search-input"
      @input="onSearchInput"
      @focus="showResults = true"
    />
    <div v-if="showResults && filteredObjects.length > 0" class="search-results">
      <div
        v-for="obj in filteredObjects"
        :key="obj.id"
        class="search-result-item"
        @click="selectObject(obj)"
      >
        <div class="result-title">{{ obj.title }}</div>
        <div class="result-meta">
          <span class="result-id">ID: {{ obj.id }}</span>
          <span class="result-type">{{ obj.typeLabel }}</span>
        </div>
      </div>
    </div>
    <div v-if="showResults && searchQuery && filteredObjects.length === 0" class="no-results">
      Объекты не найдены
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  objects: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['object-selected'])

const searchQuery = ref('')
const showResults = ref(false)

const filteredObjects = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }

  const query = searchQuery.value.toLowerCase()

  return props.objects
    .filter(obj => {
      if (!obj.searchfield) return false
      return obj.searchfield.toLowerCase().includes(query)
    })
    .slice(0, 10)
})

function onSearchInput() {
  showResults.value = true
}

function selectObject(obj) {
  emit('object-selected', obj)
  searchQuery.value = ''
  showResults.value = false
}

if (process.client) {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.object-search')) {
      showResults.value = false
    }
  })
}
</script>

<style scoped>
.object-search {
  position: absolute;
  top: 130px;
  left: 10px;
  z-index: 1000;
  width: 320px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #0066cc;
}

.search-results {
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.result-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.result-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.result-id {
  font-family: monospace;
}

.result-type {
  padding: 2px 8px;
  background: #e8f4ff;
  color: #0066cc;
  border-radius: 4px;
  font-weight: 500;
}

.no-results {
  margin-top: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 14px;
  text-align: center;
}
</style>
