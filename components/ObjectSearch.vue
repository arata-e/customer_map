<template>
  <div class="object-search">
    <button
      v-if="!isExpanded"
      class="search-toggle-btn"
      @click="toggleSearch"
      title="Поиск объектов"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </button>

    <div v-if="isExpanded" class="search-expanded">
      <div class="search-header">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Поиск объектов (ID или название)..."
          class="search-input"
          @input="onSearchInput"
          @focus="showResults = true"
        />
        <button class="close-btn" @click="closeSearch" title="Закрыть">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

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
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  objects: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['object-selected'])

const searchQuery = ref('')
const showResults = ref(false)
const isExpanded = ref(false)
const searchInput = ref(null)

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
  isExpanded.value = false
}

async function toggleSearch() {
  isExpanded.value = true
  await nextTick()
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

function closeSearch() {
  isExpanded.value = false
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
  top: 76px;
  left: 10px;
  z-index: 1000;
}

.search-toggle-btn {
  width: 30px;
  height: 30px;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
}

.search-toggle-btn:hover {
  background: #f4f4f4;
  border-color: rgba(0, 0, 0, 0.3);
}

.search-toggle-btn svg {
  color: #333;
}

.search-expanded {
  width: 340px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #0066cc;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e0e0e0;
}

.close-btn svg {
  color: #666;
}

.search-results {
  background: white;
  max-height: 400px;
  overflow-y: auto;
  border-top: 1px solid #f0f0f0;
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
  padding: 12px 16px;
  background: white;
  color: #666;
  font-size: 14px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}
</style>
