<template>
  <!-- FirePlan Logo: Fire icon + "FIREPLAN" wordmark -->
  <svg
    width="280"
    height="52"
    viewBox="0 0 280 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Fire icon -->
    <g transform="translate(2, 2)">
      <!-- Outer flame -->
      <path
        d="M22 46 C8 46 2 36 2 24 C2 14 8 6 16 2 C14 8 16 14 20 16 C18 10 22 4 28 2 C26 8 30 12 34 10 C32 16 36 20 40 18 C38 24 42 28 42 32 C42 40 34 46 22 46Z"
        fill="var(--ui-primary)"
        fill-opacity="0.15"
        stroke="var(--ui-primary)"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Inner flame -->
      <path
        d="M22 40 C14 40 10 34 10 26 C10 20 14 14 18 12 C17 16 18 20 21 21 C20 17 22 13 26 12 C25 16 27 19 30 18 C29 22 31 25 31 28 C31 34 27 40 22 40Z"
        fill="var(--ui-primary)"
        fill-opacity="0.4"
      />
      <!-- Spark dots -->
      <circle cx="28" cy="8" r="2" fill="var(--ui-primary)" />
      <circle cx="34" cy="12" r="1.5" fill="var(--ui-primary)" fill-opacity="0.7" />
      <circle cx="38" cy="8" r="1" fill="var(--ui-primary)" fill-opacity="0.5" />
    </g>

    <!-- "FIRE" in currentColor -->
    <text
      x="56"
      y="39"
      font-family="'Public Sans', system-ui, sans-serif"
      font-size="34"
      font-weight="700"
      letter-spacing="-0.5"
      fill="currentColor"
    >FIRE</text>

    <!-- "PLAN" in primary color -->
    <text
      x="148"
      y="39"
      font-family="'Public Sans', system-ui, sans-serif"
      font-size="34"
      font-weight="700"
      letter-spacing="-0.5"
      fill="var(--ui-primary)"
    >PLAN</text>
  </svg>
</template>
