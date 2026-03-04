<script setup lang="ts">
import { existsSync } from 'fs';
import { inject, ref } from 'vue';
import Global from './Global.vue';
import Module from './Module.vue';
import { keyAppRoot, keyMessage } from './provide-inject';
import { hasGlobal, moduleList } from './stores/common';
import { convertUrlToPath, getFoldersSync } from './utils/utils';

// 注入根DOM和消息服务
const appRootDom = inject(keyAppRoot);
const message = inject(keyMessage)!;

// 当前激活的组件
const activeComponent = ref<'Module' | 'Global'>('Module');

hasGlobal.value = existsSync(convertUrlToPath('db://assets/app-global'));
moduleList.value = getFoldersSync(convertUrlToPath('db://assets/app-module'));
</script>

<template>
    <el-container class="main-container">
        <!-- 顶部导航菜单 -->
        <el-header class="header-menu">
            <el-menu mode="horizontal" :default-active="activeComponent"
                @select="(key: 'Module' | 'Global') => activeComponent = key">
                <el-menu-item index="Module">Module</el-menu-item>
                <el-menu-item index="Global">Global</el-menu-item>
            </el-menu>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main-content">
            <component :is="activeComponent === 'Module' ? Module : Global" />
        </el-main>
    </el-container>


</template>

<style scoped>
.main-container {
    height: 100%;
    overflow: hidden;
}

.main-content {
    padding: 0;
    height: auto;
}

.header-menu {
    border-bottom: 1px solid var(--el-border-color-light);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 0 20px;
}

.el-menu {
    background: transparent;
    border-bottom: none;
}

.el-menu--horizontal {
    border-bottom: none;
}

.el-menu-item {
    font-weight: 500;
    transition: all 0.3s;
    color: white;
}
</style>
