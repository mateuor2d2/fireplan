<template>
  <!-- Prevenius Logo: Shield + Checkmark icon + "PREVENIUS" wordmark -->
  <svg
    width="420"
    height="52"
    viewBox="0 0 420 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Shield icon -->
    <path
      d="M26 3 L4 14 L4 33 Q4 44 26 49 Q48 44 48 33 L48 14 Z"
      stroke="var(--ui-primary)"
      stroke-width="2"
      fill="var(--ui-primary)"
      fill-opacity="0.12"
    />
    <!-- Checkmark inside shield -->
    <path
      d="M15 27 L22 35 L39 17"
      stroke="var(--ui-primary)"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- "PRE" in currentColor (adapts to dark/light) -->
    <text
      x="60"
      y="39"
      font-family="'Public Sans', system-ui, sans-serif"
      font-size="34"
      font-weight="700"
      letter-spacing="-0.5"
      fill="currentColor"
    >PRE</text>
    <!-- "VENIUS" in primary color (magenta) -->
    <text
      x="140"
      y="39"
      font-family="'Public Sans', system-ui, sans-serif"
      font-size="34"
      font-weight="700"
      letter-spacing="-0.5"
      fill="var(--ui-primary)"
    >VENIUS</text>
  </svg>
</template>
