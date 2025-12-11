<template>
  <div class="reset-view-button">
    <button
      class="reset-btn"
      @click="resetView"
      title="Вернуть исходный вид карты"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
        <path d="M21 3v5h-5"></path>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
        <path d="M3 21v-5h5"></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
const emit = defineEmits(['reset-view'])

function resetView() {
  emit('reset-view')
}
</script>

<style scoped>
.reset-view-button {
  position: absolute;
  top: 124px;
  left: 10px;
  z-index: 1000;
}

.reset-btn {
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

.reset-btn:hover {
  background: #f4f4f4;
  border-color: rgba(0, 0, 0, 0.3);
}

.reset-btn svg {
  color: #333;
}
</style>
