<script setup>
// Purely decorative page background (waves, halftone dots, sparkles, hearts). It sits behind everything,
// ignores the pointer, and is hidden from assistive technology. Contains no data and no behaviour.
</script>

<template>
  <div class="decor" aria-hidden="true">
    <!-- landscape screens -->
    <svg class="wide" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <pattern id="gk-dots" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.7" fill="#e88f89" /></pattern>
        <radialGradient id="gk-fade-a" cx="0.75" cy="0.3" r="0.75"><stop offset="0.25" stop-color="#fff" /><stop offset="1" stop-color="#000" /></radialGradient>
        <radialGradient id="gk-fade-b" cx="0.5" cy="0.9" r="0.7"><stop offset="0.2" stop-color="#fff" /><stop offset="1" stop-color="#000" /></radialGradient>
        <mask id="gk-mask-a"><rect x="1210" y="60" width="230" height="270" fill="url(#gk-fade-a)" /></mask>
        <mask id="gk-mask-b"><rect x="480" y="730" width="400" height="170" fill="url(#gk-fade-b)" /></mask>
      </defs>

      <!-- organic waves -->
      <path d="M0 585 C70 548 165 575 235 660 C305 745 420 840 560 900 L0 900Z" fill="#f9d2ce" />
      <path d="M0 640 C60 606 150 618 215 695 C285 778 400 856 520 900 L0 900Z" fill="#fce3e0" />
      <path d="M1440 560 C1335 528 1215 610 1125 705 C1045 790 950 868 880 900 L1440 900Z" fill="#f9d2ce" />
      <path d="M1440 625 C1345 596 1240 668 1160 750 C1085 828 1005 880 945 900 L1440 900Z" fill="#fce3e0" />

      <!-- thin coral lines -->
      <path d="M0 692 C72 702 142 762 192 900" fill="none" stroke="#e1736b" stroke-width="2.2" stroke-linecap="round" />
      <path d="M930 900 C1110 795 1255 560 1440 592" fill="none" stroke="#e1736b" stroke-width="2.2" stroke-linecap="round" />

      <!-- halftone clusters -->
      <g mask="url(#gk-mask-a)" opacity="0.95"><rect x="1210" y="60" width="230" height="270" fill="url(#gk-dots)" /></g>
      <g mask="url(#gk-mask-b)" opacity="0.95"><rect x="480" y="730" width="400" height="170" fill="url(#gk-dots)" /></g>

      <!-- four point sparkles -->
      <g fill="#fff">
        <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(1376 150) scale(1)" />
        <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(96 250) scale(0.7)" />
        <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(1392 470) scale(0.8)" />
        <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(52 520) scale(0.9)" />
        <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(760 820) scale(0.75)" />
        <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(1000 70) scale(0.55)" />
      </g>

      <!-- white dots -->
      <g fill="#fff">
        <circle cx="1230" cy="82" r="8" /><circle cx="1405" cy="300" r="6" />
        <circle cx="92" cy="150" r="6" /><circle cx="36" cy="330" r="8" />
        <circle cx="905" cy="760" r="6" /><circle cx="1090" cy="860" r="5" />
      </g>

      <!-- pastel hearts and sprinkles -->
      <g>
        <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#8d99be" transform="translate(60 410) rotate(-14) scale(1.1)" />
        <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#e26d65" transform="translate(1372 372) rotate(12) scale(0.9)" />
        <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#a9c2ec" transform="translate(1262 812) rotate(-10) scale(1)" />
        <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#fff" transform="translate(320 880) rotate(8) scale(1.2)" />
        <g stroke-linecap="round" stroke-width="7">
          <path d="M1346 232l-6 12" stroke="#e26d65" /><path d="M1420 400l10 8" stroke="#a9c2ec" />
          <path d="M74 470l-8 10" stroke="#a9c2ec" /><path d="M600 870l12-4" stroke="#8d99be" />
        </g>
      </g>
    </svg>

    <!-- portrait screens (phones) -->
    <svg class="tall" viewBox="0 0 600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <pattern id="gk-dots-t" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.7" fill="#e88f89" /></pattern>
        <radialGradient id="gk-fade-t" cx="0.8" cy="0.2" r="0.8"><stop offset="0.25" stop-color="#fff" /><stop offset="1" stop-color="#000" /></radialGradient>
        <mask id="gk-mask-t"><rect x="380" y="30" width="220" height="230" fill="url(#gk-fade-t)" /></mask>
      </defs>
      <path d="M0 800 C60 770 130 790 190 850 C230 890 280 930 330 1000 L0 1000Z" fill="#f9d2ce" />
      <path d="M0 850 C50 826 110 840 160 892 C205 938 250 972 285 1000 L0 1000Z" fill="#fce3e0" />
      <path d="M600 760 C520 740 450 800 400 870 C370 915 345 960 320 1000 L600 1000Z" fill="#f9d2ce" />
      <path d="M600 820 C530 802 470 852 430 910 C405 946 385 975 370 1000 L600 1000Z" fill="#fce3e0" />
      <path d="M0 872 C50 880 110 920 140 1000" fill="none" stroke="#e1736b" stroke-width="2" stroke-linecap="round" />
      <path d="M345 1000 C440 900 520 790 600 806" fill="none" stroke="#e1736b" stroke-width="2" stroke-linecap="round" />
      <g mask="url(#gk-mask-t)" opacity="0.95"><rect x="380" y="30" width="220" height="230" fill="url(#gk-dots-t)" /></g>
      <g fill="#fff">
        <path d="M0-24C2-9 9-2 24 0 9 2 2 9 0 24-2 9-9 2-24 0-9-2-2-9 0-24Z" transform="translate(540 470) scale(0.7)" />
        <circle cx="450" cy="300" r="6" /><circle cx="300" cy="640" r="5" />
      </g>
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#8d99be" transform="translate(48 600) rotate(-14)" />
      <path d="M0 12C-17 0-13-13-6-13-2.5-13 0-10.5 0-8 0-10.5 2.5-13 6-13 13-13 17 0 0 12Z" fill="#e26d65" transform="translate(556 650) rotate(12) scale(0.9)" />
    </svg>
  </div>
</template>

<style scoped>
.decor { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
.decor svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.tall { display: none; }
@media (max-aspect-ratio: 1/1) {
  .wide { display: none; }
  .tall { display: block; }
}
</style>
