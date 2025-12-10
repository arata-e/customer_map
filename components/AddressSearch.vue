<template>
  <div class="address-search-wrapper">
    <VueDadataSuggestions
      v-model="address"
      :token="dadataToken"
      type="ADDRESS"
      :placeholder="placeholder"
      @select="onAddressSelect"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VueDadataSuggestions from 'vue-dadata-suggestions'

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

const address = ref('')

function onAddressSelect(suggestion) {
  if (suggestion?.data?.geo_lat && suggestion?.data?.geo_lon) {
    emit('address-selected', {
      lat: parseFloat(suggestion.data.geo_lat),
      lng: parseFloat(suggestion.data.geo_lon),
      label: suggestion.value,
      data: suggestion
    })
  }
}
</script>

<style scoped>
.address-search-wrapper {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  width: 300px;
}

.address-search-wrapper :deep(.vue-dadata-suggestions) {
  width: 100%;
}

.address-search-wrapper :deep(input) {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 14px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.address-search-wrapper :deep(input:focus) {
  outline: none;
  border-color: #0066cc;
}

.address-search-wrapper :deep(.suggestions) {
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

.address-search-wrapper :deep(.suggestion) {
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

.address-search-wrapper :deep(.suggestion:hover) {
  background: #f5f5f5;
}

.address-search-wrapper :deep(.suggestion:last-child) {
  border-bottom: none;
}
</style>
