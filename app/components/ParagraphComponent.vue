<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  titleSize: {
    type: Number,
    default: 16
  },
  bold: {
    type: Boolean,
    default: false
  },
  italic: {
    type: Boolean,
    default: false
  }
})

const localTitle = ref(props.title)
const localTitleSize = ref(props.titleSize)
const localBold = ref(props.bold)
const localItalic = ref(props.italic)
</script>

<template>
  <div>
    <UInput
      v-model="localTitle"
      placeholder="Enter title"
    />
    <UInput
      v-model="localTitle"
      placeholder="Enter title"
    />
    <UInput
      v-model.number="localTitleSize"
      type="number"
      placeholder="Enter font size"
    />
    <UCheckbox
      v-model="localBold"
      label="Bold"
    />
    <UCheckbox
      v-model="localItalic"
      label="Italic"
    />
  </div>
</template>
