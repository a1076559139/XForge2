
class CallbackInfo {
    constructor(
        public readonly callback: Function,
        public readonly target: any = null,
        public readonly once: boolean = false
    ) { }
}

class CallbackList {
    private callbacks: CallbackInfo[] = [];

    size(): number {
        return this.callbacks.length;
    }

    add(callback: Function, target: any = null, once: boolean = false): void {
        this.callbacks.push(new CallbackInfo(callback, target, once));
    }

    emit(e: MessageBus.IEvent): void {
        for (let i = 0; i < this.callbacks.length;) {
            const info = this.callbacks[i];
            if (info.once) {
                this.callbacks.splice(i, 1);
            } else {
                i++;
            }
            info.callback.call(info.target, e);
        }
    }

    request<Response>(r: MessageBus.IRequest<Response>): Response {
        if (this.callbacks.length === 0) return null as Response;

        const info = this.callbacks[0];
        if (info.once) {
            this.callbacks.splice(0, 1);
        }

        return info.callback.call(info.target, r);
    }

    remove(callback: Function): void {
        for (let i = this.callbacks.length - 1; i >= 0; i--) {
            const info = this.callbacks[i];
            if (info.callback === callback) {
                this.callbacks.splice(i, 1);
            }
        }
    }

    removeByTarget(target: any): void {
        for (let i = this.callbacks.length - 1; i >= 0; i--) {
            const info = this.callbacks[i];
            if (info.target === target) {
                this.callbacks.splice(i, 1);
            }
        }
    }
}

export namespace MessageBus {
    // 请求接口
    export interface IRequest<IResponse> {
    }

    // 事件接口
    export interface IEvent {
    }
}

export class MessageBus {
    private listeners: Map<Function, CallbackList> = new Map();

    /**监听事件/请求 */
    on<E extends MessageBus.IEvent>(eventClass: new (...args: any[]) => E, callback: (event: E) => void, target?: any): void;
    on<TRequest extends MessageBus.IRequest<TResponse>, TResponse>(
        requestClass: new (...args: any[]) => TRequest,
        callback: (request: TRequest) => TResponse,
        target?: any
    ): void;
    on(eventClass: any, callback: any, target: any = null): void {
        if (!callback) return;

        if (!this.listeners.has(eventClass))
            this.listeners.set(eventClass, new CallbackList());

        this.listeners.get(eventClass)?.add(callback, target);
    }

    /**监听一次性事件/请求 */
    once<E extends MessageBus.IEvent>(eventClass: new (...args: any[]) => E, callback: (event: E) => void, target?: any): void;
    once<TRequest extends MessageBus.IRequest<TResponse>, TResponse>(
        requestClass: new (...args: any[]) => TRequest,
        callback: (request: TRequest) => TResponse,
        target?: any
    ): void;
    once(eventClass: any, callback: any, target: any = null): void {
        if (!callback) return;

        if (!this.listeners.has(eventClass))
            this.listeners.set(eventClass, new CallbackList());

        this.listeners.get(eventClass)?.add(callback, target, true);
    }

    /**移除事件/请求监听 */
    off<E extends MessageBus.IEvent>(eventClass: new (...args: any[]) => E, callback: (event: E) => void): void;
    off<TRequest extends MessageBus.IRequest<TResponse>, TResponse>(
        requestClass: new (...args: any[]) => TRequest,
        callback: (request: TRequest) => TResponse
    ): void;
    off(eventClass: any, callback: any): void {
        if (!callback) return;

        const callbackList = this.listeners.get(eventClass);
        if (callbackList)
            callbackList.remove(callback);
    }

    /**发射事件 */
    emit(e: MessageBus.IEvent): void {
        const type = e.constructor;
        const callbackList = this.listeners.get(type);
        if (callbackList)
            callbackList.emit(e);
    }

    /**发送请求 */
    request<TResponse>(r: MessageBus.IRequest<TResponse>): TResponse {
        const type = r.constructor;
        const callbackList = this.listeners.get(type);
        return callbackList ? callbackList.request(r) : null as TResponse;
    }

    public targetOff(target?: unknown) {
        if (!target) return;

        this.listeners.forEach((callbackList) => {
            callbackList.removeByTarget(target);
        })
    }
}