<template>
  <UPageCard
    variant="subtle"
  >
    <div class="relative overflow-hidden rounded-sm border border-dashed border-accented opacity-75 px-4 flex items-center justify-center aspect-video">
      <svg
        class="absolute inset-0 h-full w-full stroke-inverted/10"
        fill="none"
      >
        <defs>
          <pattern
            id="pattern-construction"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <!-- Construction-themed pattern -->
            <path
              d="M0 10 L20 10 M10 0 L10 20"
              stroke-width="1"
            />
            <circle
              cx="5"
              cy="5"
              r="1"
              fill="currentColor"
            />
            <circle
              cx="15"
              cy="15"
              r="1"
              fill="currentColor"
            />
          </pattern>
        </defs>
        <rect
          stroke="none"
          fill="url(#pattern-construction)"
          width="100%"
          height="100%"
        />
      </svg>

      <div class="relative z-10 text-center">
        <div class="i-lucide-building w-12 h-12 mx-auto mb-2 text-inverted/20" />
        <p class="text-inverted/30 text-sm">
          Imagen de construcción
        </p>
      </div>
    </div>
  </UPageCard>
</template>
