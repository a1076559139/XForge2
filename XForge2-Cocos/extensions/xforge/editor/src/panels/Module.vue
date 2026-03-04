<script setup lang="ts">
import { inject, ref } from 'vue';
import CustomSelect from './components/CustomSelect.vue';
import { keyMessage } from './provide-inject';
import { moduleList, moduleSelected } from './stores/common';
import { createModelItem, CreateModule, createServiceItem, createSoundItem, createViewItem } from './utils/create';

const message = inject(keyMessage)!;

// 模块数据
const loading = ref(false);

// 对话框控制
const dialogVisible = ref(false);
const dialogInputName = ref('');

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

const selectModule = (moduleName: string) => {
  moduleSelected.value = moduleName;
}

// 创建新模块
const createNewModule = async () => {
  loading.value = true;
  const result = await CreateModule(dialogInputName.value);
  loading.value = false;

  if (result.type === 'success') {
    dialogVisible.value = false;
    moduleList.value.push(dialogInputName.value);
    dialogInputName.value = '';
  }
  message(result);
};

// 创建新项目（Model/View/Sound)
const createItem = async () => {
  loading.value = true;
  if (activeTab.value === 'Model') {
    message(await createModelItem(modelType.value, inputName.value, moduleSelected.value));
  }
  else if (activeTab.value === 'View') {
    message(await createViewItem(viewType.value, inputName.value, moduleSelected.value));
  }
  else if (activeTab.value === 'Service') {
    message(await createServiceItem(inputName.value, moduleSelected.value));
  }
  else {
    message(await createSoundItem(soundType, moduleSelected.value));
  }
  loading.value = false;
};
</script>

<template>
  <el-container class="main-container">
    <!-- 左侧模块列表 -->
    <el-aside width="250px" class="module-sidebar">
      <el-button type="primary" class="create-module-btn" @click="dialogVisible = true" :loading="loading">
        创建模块
      </el-button>

      <el-scrollbar>
        <el-menu class="module-list" :default-active="moduleSelected">
          <el-menu-item v-for="module in moduleList" :key="module" :index="module" @click="selectModule(module)">
            {{ module }}
          </el-menu-item>

          <el-empty v-if="moduleList.length === 0" description="暂无模块" />
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-main class="main-content">
      <template v-if="moduleSelected">
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

      <el-empty v-else description="请先选择一个模块" />
    </el-main>
  </el-container>

  <!-- 创建模块对话框 -->
  <el-dialog v-model="dialogVisible" title="创建新模块" :show-close="false">
    <el-form>
      <el-form-item label="模块名称">
        <el-input v-model="dialogInputName" placeholder="请输入模块名称"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button v-if="!loading" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createNewModule" :loading="loading">创建</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.main-container {
  height: 100%;
  overflow: hidden;
}

.module-sidebar {
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}

.create-module-btn {
  margin: 10px;
  width: calc(100% - 20px);
}

.module-list {
  width: 100%;
  border-right: none;
  /* 透明色 */
  background-color: #00000000;
}

.module-list .el-menu-item {
  /* 使用浅灰色，在黑夜模式下更加清晰可见 */
  color: #c0c4cc;
}

.module-list .el-menu-item:hover {
  /* 悬停时的背景色 */
  background-color: #484848;
}

.module-list .el-menu-item.is-active {
  /* 选中项保持主题色 */
  color: var(--el-color-primary);
  /* 选中项使用稍亮的深色背景 */
  background-color: #004151;
}

.main-content {
  padding: 20px;
}

.top-menu {
  margin-bottom: 20px;
  /* 使用浅灰色，在黑夜模式下更加清晰可见 */
  color: #c0c4cc;
}

.create-form {
  padding: 20px;
  /* border: 1px solid var(--el-border-color-light); */
  /* border-radius: 4px; */
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>