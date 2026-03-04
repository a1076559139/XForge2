<script setup lang="ts">
import { inject, ref } from 'vue';
import CustomSelect from './components/CustomSelect.vue';
import { keyMessage } from './provide-inject';
import { hasGlobal } from './stores/common';
import { createModelItem, CreateModule, createServiceItem, createSoundItem, createViewItem } from './utils/create';

const message = inject(keyMessage)!;

const loading = ref(false);

// 右侧菜单控制
const activeTab = ref<'Model' | 'View' | 'Service' | 'Sound'>('Model');

// View创建相关选项
const viewTypeOptions = ref(['Page', 'Paper', 'Pop', 'Top']);
const viewType = ref<'Page' | 'Paper' | 'Pop' | 'Top'>('Page');

// Sound创建相关选项
const soundTypeOptions = ref(['音乐目录', '音效目录']);
const soundType = ref<'音乐目录' | '音效目录'>('音乐目录');

// Model创建相关选项
const modelTypeOptions = ref(['Data', 'Config']);
const modelType = ref<'Data' | 'Config'>('Data');

// 输入
const inputName = ref('');

// 创建Global模块
const createGlobal = async () => {

  loading.value = true;
  const result = await CreateModule();
  loading.value = false;

  hasGlobal.value = result.type === 'success';
  message(result);
};

// 创建新项目（Model/View/Sound)
const createItem = async () => {
  loading.value = true;
  if (activeTab.value === 'Model') {
    message(await createModelItem(modelType.value, inputName.value));
  }
  else if (activeTab.value === 'View') {
    message(await createViewItem(viewType.value, inputName.value));
  }
  else if (activeTab.value === 'Service') {
    message(await createServiceItem(inputName.value));
  }
  else {
    message(await createSoundItem(soundType));
  }
  loading.value = false;
};

</script>

<template>
  <el-container class="main-container">
    <el-main class="main-content">
      <template v-if="!hasGlobal">
        <div class="create-global-container">
          <el-empty description="暂无Global模块">
            <el-button type="primary" size="large" @click="createGlobal" :loading="loading">
              创建Global模块
            </el-button>
          </el-empty>
        </div>
      </template>

      <template v-else>
        <!-- 顶部菜单 -->
        <el-tabs v-model="activeTab" class="top-menu" type="card">
          <el-tab-pane label="创建Model" name="Model"></el-tab-pane>
          <el-tab-pane label="创建Service" name="Service"></el-tab-pane>
          <el-tab-pane label="创建View" name="View"></el-tab-pane>
          <el-tab-pane label="创建Sound" name="Sound"></el-tab-pane>
        </el-tabs>

        <!-- 创建表单 -->
        <div v-if="activeTab" class="create-form">
          <el-form>
            <el-form-item label="类型" v-if="activeTab === 'Model'">
              <custom-select v-model="modelType" :options="modelTypeOptions" placeholder="请选择类型" />
            </el-form-item>
            <el-form-item label="类型" v-if="activeTab === 'Sound'">
              <custom-select v-model="soundType" :options="soundTypeOptions" placeholder="请选择类型" />
            </el-form-item>
            <el-form-item label="类型" v-if="activeTab === 'View'">
              <custom-select v-model="viewType" :options="viewTypeOptions" placeholder="请选择类型" />
            </el-form-item>
            <el-form-item label="名称" v-if="activeTab !== 'Sound'">
              <el-input v-model="inputName" placeholder="请输入名称"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="createItem" :loading="loading">创建</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-empty v-else description="请选择要创建的类型" />
      </template>
    </el-main>
  </el-container>
</template>

<style scoped>
.main-container {
  height: 100%;
  border: none;
  overflow: hidden;
}

.main-content {
  padding: 20px;
  overflow: hidden;
}

.create-global-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;
}

.create-global-container .el-button {
  margin-top: 20px;
}

.top-menu {
  margin-bottom: 20px;
  color: #c0c4cc;
}

.create-form {
  padding: 20px;
}
</style>