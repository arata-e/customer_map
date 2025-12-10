<template>
  <div class="container">
    <h1>Bitrix24 Userside Map Widget</h1>
    <div class="links">
      <NuxtLink to="/amap" class="link">
        Открыть карту
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
}

h1 {
  margin-bottom: 2rem;
  color: #333;
}

.links {
  display: flex;
  gap: 1rem;
}

.link {
  padding: 12px 24px;
  background: #0066cc;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
}

.link:hover {
  background: #0052a3;
}
</style>
