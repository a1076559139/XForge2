class CallbackInfo {
    public callback: Function = null;
    public target: unknown = null;
    public once = false;

    public constructor(callback: Function, target: unknown = null, once: boolean = false) {
        this.callback = callback;
        this.target = target;
        this.once = once;
    }
}

class CallbackList {
    private callbacks: CallbackInfo[] = [];

    public size() {
        return this.callbacks.length;
    }

    public add(callback: Function, target: unknown = null, once: boolean = false) {
        this.callbacks.push(new CallbackInfo(callback, target, once));
    }

    public emit(args: any[]) {
        for (let index = 0; index < this.callbacks.length; index++) {
            const info = this.callbacks[index];
            // 先移除
            if (info.once) {
                this.callbacks.splice(index, 1);
                --index;
            }
            if (info.callback) {
                info.callback.apply(info.target, args);
            }
        }
    }

    public request(args: any[]) {
        if (this.callbacks.length === 0) return;
        const info = this.callbacks[0];

        // 先移除
        if (info.once) this.callbacks.splice(0, 1);
        if (!info.callback) return;

        return info.callback.apply(info.target, args);
    }

    public remove(callback: Function, target: unknown = null) {
        for (let index = this.callbacks.length - 1; index >= 0; index--) {
            const info = this.callbacks[index];
            if (info.callback !== callback || info.target !== target) continue;
            this.callbacks.splice(index, 1);
        }
    }

    public removeByCallback(callback: Function) {
        for (let index = this.callbacks.length - 1; index >= 0; index--) {
            const info = this.callbacks[index];
            if (info.callback !== callback) continue;
            this.callbacks.splice(index, 1);
        }
    }

    public removeByTarget(target: unknown) {
        for (let index = this.callbacks.length - 1; index >= 0; index--) {
            const info = this.callbacks[index];
            if (info.target !== target) continue;
            this.callbacks.splice(index, 1);
        }
    }
}

export class EventBus {
    private listeners: { [key in string]: CallbackList } = {};

    public on(event: string | number, cb: (...data: any[]) => void, target?: unknown) {
        if (!event.toString() || !cb) return;
        if (!this.listeners[event]) this.listeners[event] = new CallbackList();
        this.listeners[event].add(cb, target);
    }

    public once(event: string | number, cb: (...data: any[]) => void, target?: unknown) {
        if (!event.toString() || !cb) return;
        if (!this.listeners[event]) this.listeners[event] = new CallbackList();
        this.listeners[event].add(cb, target, true);
    }

    public off(event: string | number, cb: (...data: any[]) => void, target?: unknown) {
        if (!event.toString() || !cb) return;
        if (!this.listeners[event]) return;

        this.listeners[event].remove(cb, target);
    }

    public targetOff(target?: unknown) {
        if (!target) return;

        for (const key in this.listeners) {
            if (Object.prototype.hasOwnProperty.call(this.listeners, key)) {
                const element = this.listeners[key];
                element.removeByTarget(target);
            }
        }
    }

    public emit(event: string | number, args: any[]) {
        if (!event.toString()) return;
        if (!this.listeners[event]) return;
        this.listeners[event].emit(args);
    }

    public request(event: string | number, args: any[]) {
        if (!event.toString()) return;
        if (!this.listeners[event]) return;
        return this.listeners[event].request(args);
    }
}