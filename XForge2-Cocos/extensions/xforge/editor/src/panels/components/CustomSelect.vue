<template>
  <div class="custom-select" ref="dropdownRef">
    <div 
      class="select-input"
      @click="toggleDropdown"
    >
      <span v-if="!selectedValue" class="select-placeholder">{{ placeholder }}</span>
      <span v-else>{{ selectedValue }}</span>
      <span class="arrow">▼</span>
    </div>
    
    <div 
      v-show="isOpen"
      class="dropdown-menu"
    >
      <div 
        v-for="option in options" 
        :key="option"
        class="dropdown-item"
        @click="selectOption(option)"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Array as () => string[],
    required: true
  },
  placeholder: {
    type: String,
    default: '请选择'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const selectedValue = computed(() => props.modelValue);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (option: string) => {
  emit('update:modelValue', option);
  isOpen.value = false;
};

const dropdownRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true); // 使用捕获阶段
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true);
});
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

.select-input {
  padding: 0 8px 0 8px;
  border: 1px solid #666666b3;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-placeholder{
  color: #f5f5f58a;
}

.select-input:hover {
  border-color: #c0c4cc;
}

.arrow {
  transition: transform 0.5s;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #666666;
  border-radius: 4px;
  background-color: #242424;
  z-index: 1000;
  margin-top: 4px;
}

.dropdown-item {
  padding: 0 8px 0 8px;
  cursor: pointer;
}

.dropdown-item:hover {
    background-color: #484848;
}
</style>