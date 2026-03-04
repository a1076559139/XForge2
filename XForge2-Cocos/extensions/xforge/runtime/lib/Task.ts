interface IHandle {
    (next: () => boolean, retry: (timeout?: number) => void): void
}

interface IFinish {
    (success?: boolean): any
}

export interface ITask {
    size(): number;
    add(handle: IHandle): this;
    start(finish?: IFinish | Function): boolean;
    stop(): boolean;
    isRunning(): boolean;
}

/**
 * 顺序执行
 */
export class SyncTask implements ITask {
    private started = false;
    private running = false;
    private index: number = -1;
    private list: IHandle[] = [];
    private finish: IFinish | Function = null;

    /**
     * 任务数量
     * @returns 
     */
    public size(): number {
        return this.list.length;
    }

    /**
     * 添加一个任务
     * @param handle 
     * @returns 
     */
    public add(handle: IHandle) {
        if (this.started) return this;
        this.list.push(handle);
        return this;
    }

    /**
     * 开始执行所有任务
     * @param finish 执行完毕回调
     * @returns 
     */
    public start(finish?: IFinish | Function) {
        if (this.started) return false;
        if (this.running) return false;

        this.index = -1;
        this.started = true;
        this.running = true;
        this.finish = finish;

        this.next(this.index);

        return true;
    }

    /**
     * 停止所有任务
     * @returns 
     */
    public stop(): boolean {
        if (!this.running) {
            return false;
        }

        this.running = false;
        if (this.finish) {
            this.finish(false);
        }

        return true;
    }

    /**
     * 是否正在执行
     * @returns 
     */
    public isRunning() {
        return this.running;
    }

    private end(): boolean {
        if (!this.running) {
            return false;
        }

        this.running = false;
        if (this.finish) {
            this.finish(true);
        }

        return true;
    }

    private next(index: number): boolean {
        if (!this.running) {
            return false;
        }

        if (index !== this.index) return false;

        if (++this.index < this.list.length) {
            this.retry(this.index);
        } else {
            this.end();
        }

        return true;
    }

    private retry(index: number): boolean {
        if (!this.running) {
            return false;
        }

        if (index !== this.index) return false;

        const handle = this.list[index];
        handle && handle(
            () => this.next(index),
            (timeout = 0) => {
                if (timeout) {
                    setTimeout(() => {
                        this.retry(index);
                    }, timeout * 1000);
                } else {
                    this.retry(index);
                }
            }
        );

        return true;
    }
}

/**
 * 同时执行
 */
export class ASyncTask implements ITask {
    private started = false;
    private running = false;
    private list: IHandle[] = [];
    private finish: IFinish | Function = null;

    // 标记已经完成的任务
    private finished: Set<number> = new Set();

    /**
     * 任务数量
     * @returns 
     */
    public size(): number {
        return this.list.length;
    }

    /**
     * 添加一个任务
     * @param handle 
     * @returns 
     */
    public add(handle: IHandle) {
        if (this.started) return this;
        this.list.push(handle);
        return this;
    }

    /**
     * 开始执行所有任务
     * @param finish 执行完毕回调
     * @returns 
     */
    public start(finish?: IFinish | Function) {
        if (this.started) return false;
        if (this.running) return false;

        this.started = true;
        this.running = true;
        this.finish = finish;

        if (this.list.length) {
            for (let index = 0; index < this.list.length; index++) {
                this.retry(index);
            }
        } else {
            this.end && this.end();
        }

        return true;
    }

    /**
     * 停止所有任务
     * @returns 
     */
    public stop(): boolean {
        if (!this.running) {
            return false;
        }

        this.running = false;
        if (this.finish) {
            this.finish(false);
        }

        return true;
    }

    /**
     * 是否正在执行
     * @returns 
     */
    public isRunning() {
        return this.running;
    }

    private end(): boolean {
        if (!this.running) {
            return false;
        }

        this.running = false;
        if (this.finish) {
            this.finish(true);
        }

        return true;
    }

    private next(index: number): boolean {
        if (!this.running) {
            return false;
        }

        this.finished.add(index);

        if (this.finished.size === this.list.length) {
            this.end();
        }

        return true;
    }

    private retry(index: number): boolean {
        if (!this.running) {
            return false;
        }

        const handle = this.list[index];
        handle && handle(
            () => this.next(index),
            (timeout = 0) => {
                if (timeout > 0) {
                    setTimeout(() => {
                        this.retry(index);
                    }, timeout * 1000);
                } else {
                    this.retry(index);
                }
            }
        );

        return true;
    }
}

export class AnyTask implements ITask {
    private task = new SyncTask();

    /**
     * 任务数量
     * @returns 
     */
    public size() {
        return this.task.size();
    }

    /**
     * 添加一个任务
     * @param handle 
     * @returns 
     */
    public add(handles: IHandle | IHandle[]) {
        if (handles instanceof Array) {
            const async = new ASyncTask();
            handles.forEach(handle => async.add(handle));
            this.task.add(async.start.bind(async));
        } else {
            this.task.add(handles);
        }
        return this;
    }

    /**
     * 开始执行所有任务
     * @param finish 执行完毕回调
     * @returns 
     */
    public start(finish?: IFinish | Function) {
        return this.task.start(finish);
    }

    /**
     * 停止所有任务
     * @returns 
     */
    public stop() {
        return this.task.stop();
    }

    /**
     * 是否正在执行
     * @returns 
     */
    public isRunning() {
        return this.task.isRunning();
    }
}

interface IExecuteCallBack {
    (retry: (timeout?: number) => void): void
}

export const task = {
    /**
     * 任务顺序执行
     */
    createSync(): SyncTask {
        return new SyncTask();
    },

    /**
     * 任务同时执行
     */
    createASync(): ASyncTask {
        return new ASyncTask();
    },

    /**
     * 根据参数指定执行顺序
     * @example
     * createAny()
     * .add(1).add(2).add(3).add(4)
     * .add([5,6,7])
     * .add(8)
     * 执行顺序，1，2，3，4依次执行，然后同时执行5，6，7，最后执行8
     */
    createAny() {
        return new AnyTask();
    },

    /**
     * 执行单个任务
     */
    execute(fun: IExecuteCallBack, retryMax = -1, retryFinish?: Function) {
        fun(function retry(timeout = 0) {
            if (retryMax === 0) return retryFinish && retryFinish();
            retryMax = retryMax > 0 ? retryMax - 1 : retryMax;
            if (timeout > 0) {
                setTimeout(() => task.execute(fun, retryMax, retryFinish), timeout * 1000);
            } else {
                task.execute(fun, retryMax, retryFinish);
            }
        });
    }
};