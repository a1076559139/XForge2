import { _decorator, AudioClip, AudioSource, Component, director, Enum, Node } from 'cc';
import { DEBUG, DEV } from 'cc/env';
import { BaseManager } from '../../base/BaseManager';
const { ccclass, property } = _decorator;

export enum SoundState {
    None,
    Loading,
    Playing,
    Paused,
    Stopped,
}

@ccclass('SoundManager:SoundInfo')
export class SoundInfo extends Component {
    private _audioSource: AudioSource | null = null;
    public get audioSource() {
        if (this._audioSource) {
            return this._audioSource;
        }
        this._audioSource = this.node.addComponent(AudioSource);
        return this._audioSource;
    }

    @property
    public soundState: SoundState = SoundState.None;
    @property
    public moduleName: string = '';
    @property
    public groupName: string = '';
    @property
    public soundName: string = '';
    @property
    public soundId: number = 0;
    @property
    public volume = 1;

    public clear(): void {
        this.audioSource.stop();
        this.audioSource.clip = null;
        this.soundState = SoundState.None;
        this.moduleName = '';
        this.groupName = '';
        this.soundName = '';
        this.soundId = 0;
        this.volume = 1;
    }
}

export class SoundManager extends BaseManager {
    static SoundState = SoundState;
    static SoundInfo = SoundInfo;

    private static _soundContainer: Node | null = null;
    private static get soundContainer(): Node {
        if (this._soundContainer) {
            return this._soundContainer;
        }
        this._soundContainer = new Node('SoundManager');
        director.getScene()?.addChild(this._soundContainer);
        director.addPersistRootNode(this._soundContainer);
        return this._soundContainer;
    }

    // 全局
    private static effectId: number = 1;
    private static effectInfoList: SoundInfo[] = [];
    private static _musicInfo: SoundInfo | null = null;
    private static get musicInfo(): SoundInfo | null {
        if (this._musicInfo) {
            return this._musicInfo;
        }
        const node = new Node('Music');
        node.parent = SoundManager.soundContainer;
        this._musicInfo = node.addComponent(SoundInfo);
        return this._musicInfo;
    }

    /** 最大同时播放的音效数量 */
    public static maxEffectCount: number = 30;

    // 音乐音量缩放，取值范围0-1
    private static _musicVolumeScale: number = 1;
    /** 音乐音量缩放 */
    public static get musicVolumeScale(): number {
        return this._musicVolumeScale;
    }
    public static set musicVolumeScale(value: number) {
        this._musicVolumeScale = value;
        // 应用到音乐源
        this.musicInfo.audioSource.volume = this.musicInfo.volume * value;
    }

    // 音效音量缩放，取值范围0-1
    private static _effectVolumeScale: number = 1;
    /** 音效音量缩放 */
    public static get effectVolumeScale(): number {
        return this._effectVolumeScale;
    }
    public static set effectVolumeScale(value: number) {
        this._effectVolumeScale = value;
        // 应用到所有音效源
        for (const soundSource of this.effectInfoList) {
            soundSource.audioSource.volume = soundSource.volume * value;
        }
    }

    private effectIntervalMap: Map<string, number> = new Map();
    private audioClipCacheMap: Map<string, AudioClip> = new Map();

    /**
     * 释放缓存
     */
    public release(): void {
        // 先停止播放中的音频
        if (SoundManager.musicInfo.moduleName === this.module.moduleName) {
            SoundManager.musicInfo.clear();
        }
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.moduleName === this.module.moduleName) {
                soundSource.clear();
            }
        }

        this.effectIntervalMap.clear();
        this.audioClipCacheMap.clear();
    }

    //#region Music
    private getMusicKey(name: string): string {
        return `${this.module.moduleName}:Music:${name}`;
    }

    /**
     * 加载音乐
     * @param name Global-Sound/Music或Module-Sound/Music下的音频文件路径
     */
    public loadMusic(name: string, onCompleted?: (clip: AudioClip | null) => void, onProgress?: (progress: number) => void): void {
        const soundKey = this.getMusicKey(name);
        if (this.audioClipCacheMap.has(soundKey)) {
            const clip = this.audioClipCacheMap.get(soundKey);
            Promise.resolve().then(() => {
                onCompleted?.(clip);
            });
            return;
        }

        const assetPath = this.module.isGlobal
            ? `global-sound/music/${name}`
            : `module-sound/music/${name}`;

        this.module.loadAsset(assetPath, AudioClip, (audio) => {
            if (!audio) {
                console.error(`${this.module.moduleName} failed to load audio ${assetPath}`);
                onCompleted?.(audio);
                return;
            }
            this.audioClipCacheMap.set(soundKey, audio);
            onCompleted?.(audio);
        }, onProgress);
    }

    /**
     * 预加载音乐
     * @param name Global-Sound/Music或Module-Sound/Music下的音频文件路径
     */
    public preloadMusic(name: string, onCompleted?: () => void, onProgress?: (progress: number) => void): void {
        this.loadMusic(name, () => onCompleted?.(), onProgress);
    }

    /**
     * 播放音乐
     * @param name Global-Sound/Music或Module-Sound/Music下的音频文件路径
     */
    public playMusic(name: string, volume = 1, onCompleted?: () => void, onProgress?: (progress: number) => void): void {
        this.loadMusic(name, (clip) => {
            if (!clip) {
                return;
            }

            // 先停止
            SoundManager.musicInfo.audioSource.stop();

            SoundManager.musicInfo.soundId = 0;
            SoundManager.musicInfo.volume = volume;
            SoundManager.musicInfo.soundName = name;
            SoundManager.musicInfo.moduleName = this.module.moduleName;
            SoundManager.musicInfo.audioSource.clip = clip;
            SoundManager.musicInfo.audioSource.loop = true;
            SoundManager.musicInfo.audioSource.volume = volume * SoundManager.musicVolumeScale;
            // SoundManager.musicSource.audioSource.mute = false;
            SoundManager.musicInfo.audioSource.playOnAwake = false;
            SoundManager.musicInfo.soundState = SoundState.Playing;
            SoundManager.musicInfo.audioSource.play();

            onCompleted?.();
        }, onProgress);
    }

    /**
     * 停止音乐
     */
    public stopMusic(): void {
        if (SoundManager.musicInfo.soundState === SoundState.Playing) {
            SoundManager.musicInfo.audioSource.stop();
            SoundManager.musicInfo.soundState = SoundState.Stopped;
        }
    }

    /**
     * 暂停音乐
     */
    public pauseMusic(): void {
        if (SoundManager.musicInfo.soundState === SoundState.Playing) {
            SoundManager.musicInfo.audioSource.pause();
            SoundManager.musicInfo.soundState = SoundState.Paused;
        }
    }

    /**
     * 恢复音乐
     */
    public resumeMusic(): void {
        if (SoundManager.musicInfo.soundState === SoundState.Paused) {
            SoundManager.musicInfo.audioSource.play();
            SoundManager.musicInfo.soundState = SoundState.Playing;
        }
    }
    //#endregion

    //#region Effect
    private getEffectKey(name: string): string {
        return `${this.module.moduleName}:Effect:${name}`;
    }

    /**
     * 加载音效
     * @param name Global-Sound/Effect或Module-Sound/Effect下的音频文件路径
     */
    public loadEffect(name: string, onCompleted?: (clip: AudioClip | null) => void, onProgress?: (progress: number) => void): void {
        const soundKey = this.getEffectKey(name);

        // 查询缓存
        if (this.audioClipCacheMap.has(soundKey)) {
            const clip = this.audioClipCacheMap.get(soundKey);
            Promise.resolve().then(() => {
                onCompleted?.(clip);
            });
            return;
        }

        const assetPath = this.module.isGlobal
            ? `global-sound/effect/${name}`
            : `module-sound/effect/${name}`;

        this.module.loadAsset(assetPath, AudioClip, (audio) => {
            if (!audio) {
                console.error(`${this.module.moduleName} failed to load audio ${assetPath}`);
                onCompleted?.(audio);
                return;
            }
            this.audioClipCacheMap.set(soundKey, audio);
            onCompleted?.(audio);
        }, onProgress);
    }

    /**
     * 预加载音效
     * @param name Global-Sound/Effect或Module-Sound/Effect下的音频文件路径
     */
    public preloadEffect(name: string, onCompleted?: () => void, onProgress?: (progress: number) => void): void {
        this.loadEffect(name, () => onCompleted?.(), onProgress);
    }

    private getEffectInfo() {
        let soundInfo: SoundInfo | null = null;

        // 查询是否有可复用的节点
        for (const source of SoundManager.effectInfoList) {
            if (source.soundState === SoundState.None || source.soundState === SoundState.Stopped) {
                soundInfo = source;
                break;
            }
        }

        if (!soundInfo) {
            // 创建新节点
            const node = new Node('Effect');
            node.parent = SoundManager.soundContainer;
            soundInfo = node.addComponent(SoundInfo);
            SoundManager.effectInfoList.push(soundInfo);
        }

        return soundInfo;
    }

    /**
     * 播放音频
     * @param module Module
     * @param group 分组
     * @param name Global-Sound/Effect或Module-Sound/Effect下的音频文件路径
     * @param interval 播放时间间隔(单位:秒)
     * @returns 音频Id(从1开始, -1表示不能播放)
     */
    public playEffectWithGroup(group: string | null, name: string, interval: number = 0, loop = false, volume = 1): number {
        if (SoundManager.effectInfoList.length > SoundManager.maxEffectCount) {
            return -1;
        }

        const nowMs = Date.now();
        const soundKey = this.getEffectKey(name);
        if (this.effectIntervalMap.has(soundKey) && nowMs < this.effectIntervalMap.get(soundKey)) {
            return -1;
        }

        const soundId = SoundManager.effectId++;
        const effectInfo = this.getEffectInfo();
        effectInfo.soundId = soundId;
        effectInfo.volume = volume;
        effectInfo.groupName = group;
        effectInfo.soundName = name;
        effectInfo.moduleName = this.module.moduleName;
        effectInfo.soundState = SoundState.Loading;

        this.loadEffect(name, (clip) => {
            if (effectInfo.soundId !== soundId) {
                return;
            }

            if (!clip) {
                effectInfo.soundState = SoundState.None;
                return;
            }

            if (interval > 0) {
                this.effectIntervalMap.set(soundKey, nowMs + interval * 1000);
            }

            effectInfo.audioSource.clip = clip;
            effectInfo.audioSource.loop = loop;
            effectInfo.audioSource.volume = volume * SoundManager.effectVolumeScale;
            // soundSource.audioSource.mute = false;
            effectInfo.audioSource.playOnAwake = false;

            if (effectInfo.soundState === SoundState.Loading || effectInfo.soundState === SoundState.Playing) {
                effectInfo.soundState = SoundState.Playing;
                effectInfo.audioSource.play();
            }
        });

        return soundId;
    }

    /**
     * 播放音频
     * @param name Global-Sound/Effect或Module-Sound/Effect下的音频文件路径
     * @param interval 播放时间间隔(单位:秒)
     * @returns 音频Id(从1开始)
     */
    public playEffect(name: string, interval: number = 0, loop = false, volume = 1): number {
        return this.playEffectWithGroup(null, name, interval, loop, volume);
    }

    /**
     * 停止音频
     * @param id 音频Id
     */
    public stopEffect(id: number): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped
                && soundSource.soundId === id && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.stop();
                soundSource.soundState = SoundState.Stopped;
                return;
            }
        }
    }

    /**
     * 暂停音频
     * @param id 音频Id
     */
    public pauseEffect(id: number): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped && soundSource.soundState !== SoundState.Paused
                && soundSource.soundId === id && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.pause();
                soundSource.soundState = SoundState.Paused;
                return;
            }
        }
    }

    /**
     * 恢复音频
     * @param id 音频Id
     */
    public resumeEffect(id: number): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState === SoundState.Paused
                && soundSource.soundId === id && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.play();
                soundSource.soundState = SoundState.Playing;
                return;
            }
        }
    }

    /**
     * 停止音频
     * @param name Sound name
     */
    public stopEffectsByName(name: string): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped
                && soundSource.soundName === name && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.stop();
                soundSource.soundState = SoundState.Stopped;
            }
        }
    }

    /**
     * 暂停音频
     * @param name Sound name
     */
    public pauseEffectsByName(name: string): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped && soundSource.soundState !== SoundState.Paused
                && soundSource.soundName === name && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.pause();
                soundSource.soundState = SoundState.Paused;
            }
        }
    }

    /**
     * 恢复音频
     * @param name Sound name
     */
    public resumeEffectsByName(name: string): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState === SoundState.Paused
                && soundSource.soundName === name && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.play();
                soundSource.soundState = SoundState.Playing;
            }
        }
    }

    /**
     * 根据组停止音效
     * @param group Group name
     */
    public stopEffectsByGroup(group: string): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped
                && soundSource.groupName === group && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.stop();
                soundSource.soundState = SoundState.Stopped;
            }
        }
    }

    /**
     * 根据组名暂停音效
     * @param group Group name
     */
    public pauseEffectsByGroup(group: string): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped && soundSource.soundState !== SoundState.Paused
                && soundSource.groupName === group && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.pause();
                soundSource.soundState = SoundState.Paused;
            }
        }
    }

    /**
     * 根据组名恢复音效
     * @param group Group name
     */
    public resumeEffectsByGroup(group: string): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState === SoundState.Paused
                && soundSource.groupName === group && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.play();
                soundSource.soundState = SoundState.Playing;
            }
        }
    }

    /**
     * 停止所有音频
     */
    public stopEffects(): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped
                && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.stop();
                soundSource.soundState = SoundState.Stopped;
            }
        }
    }

    /**
     * 暂停所有音频
     */
    public pauseEffects(): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped && soundSource.soundState !== SoundState.Paused
                && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.pause();
                soundSource.soundState = SoundState.Paused;
            }
        }
    }

    /**
     * 恢复所有音频
     */
    public resumeEffects(): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState === SoundState.Paused
                && soundSource.moduleName === this.module.moduleName) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.play();
                soundSource.soundState = SoundState.Playing;
            }
        }
    }

    /**
     * 停止所有音频
     */
    public static stopAllEffects(): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.stop();
                soundSource.soundState = SoundState.Stopped;
            }
        }
    }

    /**
     * 暂停所有音频
     */
    public static pauseAllEffects(): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState !== SoundState.None && soundSource.soundState !== SoundState.Stopped && soundSource.soundState !== SoundState.Paused) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.pause();
                soundSource.soundState = SoundState.Paused;
            }
        }
    }

    /**
     * 恢复所有音频
     */
    public static resumeAllEffects(): void {
        for (const soundSource of SoundManager.effectInfoList) {
            if (soundSource.soundState === SoundState.Paused) {
                if (soundSource.audioSource.clip)
                    soundSource.audioSource.play();
                soundSource.soundState = SoundState.Playing;
            }
        }
    }
    //#endregion
}

if (DEV || DEBUG) {
    //@ts-ignore
    window['SoundManager'] = SoundManager;
}