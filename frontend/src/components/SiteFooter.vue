<script setup>
const year = new Date().getFullYear();
</script>

<template>
  <footer class="foot">
    <div class="inner">
      <span class="name">Gutarik Kue</span>
      <span>Kue buatan tangan, dipesan sesuai kebutuhan Anda.</span>
      <span class="copy">&copy; {{ year }} Gutarik Kue. Seluruh hak cipta dilindungi.</span>
    </div>
  </footer>
</template>

<style scoped>
.foot { padding: 0 24px 30px; position: relative; }
.inner { max-width: 1120px; margin: 0 auto; padding-top: 22px; border-top: 1px solid var(--slate); display: flex; flex-wrap: wrap; gap: 10px 36px; align-items: center; font: 500 0.7rem var(--font-body); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text); }
.name { font: 800 0.8rem var(--font-brand); letter-spacing: 0.18em; color: var(--slate); }
.copy { margin-left: auto; }
@media (max-width: 720px) { .copy { margin-left: 0; } }
</style>
