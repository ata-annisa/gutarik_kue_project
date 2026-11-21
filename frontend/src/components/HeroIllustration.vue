<script setup>
// Hand drawn hero artwork (two cupcakes with blue striped wrappers, hearts and sparkles).
// Decorative only: it carries no data and is hidden from assistive technology.
</script>

<template>
  <svg class="hero-art" viewBox="0 0 620 500" role="presentation" aria-hidden="true" focusable="false">
    <!-- soft backdrop blob -->
    <path d="M70 330C40 220 120 110 260 96c130-12 250 24 300 130 46 98-10 214-150 250-150 38-310 20-340-146Z" fill="#fce3e0" opacity="0.55" />

    <!-- big hearts -->
    <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#8d99be" transform="translate(325 150) rotate(-4) scale(3.1)" />
    <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#8d99be" transform="translate(300 438) rotate(-8) scale(3.4)" />
    <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#fff" transform="translate(478 452) rotate(10) scale(2.4)" />

    <!-- cupcake A (left) -->
    <g transform="translate(190 392) rotate(-6)">
      <path d="M-100 -96C-60 -92 60 -92 100 -96L70 0H-70Z" fill="#6f7db4" stroke="#6f7db4" stroke-width="12" stroke-linejoin="round" />
      <g stroke="#4f5d88" stroke-width="3.2" stroke-linecap="round" opacity="0.7">
        <path d="M-80 -90L-56 -6" /><path d="M-48 -92L-34 -6" /><path d="M-16 -92L-12 -6" /><path d="M16 -92L12 -6" /><path d="M48 -92L34 -6" /><path d="M80 -90L56 -6" />
      </g>
      <rect x="-108" y="-112" width="216" height="24" rx="12" fill="#8d99be" />
      <!-- bow -->
      <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" transform="translate(-26 -52)">
        <path d="M0 0C-24-24-44-2-12 9" /><path d="M0 0C24-24 44-2 12 9" /><path d="M0 4L-16 32" /><path d="M0 4L18 30" />
        <circle r="5" fill="#fff" stroke="none" />
      </g>
      <path d="M-70 -34L70 -66" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8" />
      <!-- frosting -->
      <g fill="#e6e9f5"><circle cx="-58" cy="-143" r="60" /><circle cx="6" cy="-176" r="68" /><circle cx="64" cy="-130" r="56" /><ellipse cx="0" cy="-104" rx="102" ry="32" /></g>
      <g fill="#fff"><circle cx="-58" cy="-150" r="60" /><circle cx="6" cy="-184" r="68" /><circle cx="64" cy="-138" r="56" /><ellipse cx="0" cy="-112" rx="102" ry="30" /></g>
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#e26d65" transform="translate(-60 -150) rotate(-8) scale(1.25)" />
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#a9c2ec" transform="translate(-2 -196) rotate(6) scale(1.2)" />
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#e26d65" transform="translate(66 -134) rotate(10) scale(1.05)" />
      <g fill="#8d99be"><circle cx="-30" cy="-112" r="5" /><circle cx="38" cy="-166" r="5" /><circle cx="96" cy="-112" r="5" /></g>
      <circle cx="-88" cy="-118" r="4" fill="#e26d65" />
    </g>

    <!-- cupcake B (right) -->
    <g transform="translate(440 410) rotate(8) scale(0.94)">
      <path d="M-100 -96C-60 -92 60 -92 100 -96L70 0H-70Z" fill="#6f7db4" stroke="#6f7db4" stroke-width="12" stroke-linejoin="round" />
      <g stroke="#4f5d88" stroke-width="3.2" stroke-linecap="round" opacity="0.7">
        <path d="M-80 -90L-56 -6" /><path d="M-48 -92L-34 -6" /><path d="M-16 -92L-12 -6" /><path d="M16 -92L12 -6" /><path d="M48 -92L34 -6" /><path d="M80 -90L56 -6" />
      </g>
      <rect x="-108" y="-112" width="216" height="24" rx="12" fill="#8d99be" />
      <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" transform="translate(-22 -54)">
        <path d="M0 0C-24-24-44-2-12 9" /><path d="M0 0C24-24 44-2 12 9" /><path d="M0 4L-16 32" /><path d="M0 4L18 30" />
        <circle r="5" fill="#fff" stroke="none" />
      </g>
      <path d="M-70 -30L70 -62" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8" />
      <g fill="#e6e9f5"><circle cx="-56" cy="-136" r="58" /><circle cx="4" cy="-172" r="66" /><circle cx="62" cy="-126" r="55" /><ellipse cx="0" cy="-102" rx="102" ry="32" /></g>
      <g fill="#fff"><circle cx="-56" cy="-143" r="58" /><circle cx="4" cy="-180" r="66" /><circle cx="62" cy="-134" r="55" /><ellipse cx="0" cy="-110" rx="102" ry="30" /></g>
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#e26d65" transform="translate(2 -190) rotate(-4) scale(1.25)" />
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#a9c2ec" transform="translate(62 -134) rotate(8) scale(1.15)" />
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#e26d65" transform="translate(-56 -138) rotate(-10) scale(0.9)" />
      <g fill="#8d99be"><circle cx="-24" cy="-104" r="5" /><circle cx="-36" cy="-176" r="5" /><circle cx="94" cy="-108" r="5" /></g>
      <circle cx="30" cy="-130" r="4" fill="#e26d65" />
    </g>

    <!-- sparkles and dots -->
    <g fill="#fff">
      <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(40 178) scale(1.05)" />
      <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(588 138) scale(1.35)" />
      <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(52 462) scale(0.8)" />
      <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(592 452) scale(1.2)" />
      <circle cx="104" cy="62" r="9" /><circle cx="552" cy="40" r="10" /><circle cx="400" cy="50" r="6" /><circle cx="40" cy="300" r="6" />
      <circle cx="590" cy="320" r="7" /><circle cx="150" cy="470" r="5" />
    </g>
    <g fill="#e26d65"><circle cx="262" cy="70" r="5" /><circle cx="560" cy="236" r="4" /></g>
    <g fill="#8d99be"><circle cx="228" cy="52" r="5" /><circle cx="520" cy="188" r="5" /></g>
  </svg>
</template>

<style scoped>
.hero-art { display: block; width: 100%; height: auto; max-width: 620px; margin-left: auto; filter: drop-shadow(0 18px 24px rgba(79, 93, 136, 0.12)); }
</style>
