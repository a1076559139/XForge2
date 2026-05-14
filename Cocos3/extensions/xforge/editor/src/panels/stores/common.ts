import { ref } from 'vue';

export const hasGlobal = ref(false);
export const moduleList = ref<string[]>([]);
export const moduleSelected = ref<string>('');