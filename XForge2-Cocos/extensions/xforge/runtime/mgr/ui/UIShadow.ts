import { Component, Sprite, UIOpacity, _decorator } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIShadow')
@requireComponent(Sprite)
@requireComponent(UIOpacity)
export default class UIShadow extends Component {
    @property
    private _delay = 0;
    @property
    get delay() { return this._delay; }
    set delay(v) { this._delay = Math.max(v, 0); }

    @property
    private _begin = 0;
    @property
    get begin() { return this._begin; }
    set begin(v) { if (v >= 0 && v <= 255) this._begin = v; }

    @property
    private _end = 255;
    @property
    get end() { return this._end; }
    set end(v) { if (v >= 0 && v <= 255) this._end = v; }

    @property
    private _speed = 10;
    @property
    get speed() {
        if (this.begin == this.end) {
            return 0;
        } else if (this.begin > this.end) {
            return this._speed > 0 ? -this._speed : this._speed;
        } else {
            return this._speed >= 0 ? this._speed : -this._speed;
        }
    }
    set speed(v) { this._speed = v; }

    private get opacity() {
        return this.node.getComponent(UIOpacity);
    }

    private inited = false;
    private drawing = false;
    private timedown = 0;

    init() {
        this.drawing = true;

        if (this.inited) return;
        this.inited = true;
        this.timedown = this.delay;
        // 初始透明度
        this.opacity.opacity = this.timedown > 0 ? 0 : this.begin;
    }

    clear() {
        this.inited = false;
        this.drawing = false;
    }

    protected update(dt: number) {
        if (!this.inited) return;
        if (!this.drawing) return;

        if (this.timedown > 0) {
            this.timedown -= dt;
            if (this.timedown > 0) return;
            // 初始透明度
            this.opacity.opacity = this.begin;
        }

        const uiOpacity = this.opacity;
        if (this.speed > 0) {
            uiOpacity.opacity += this.speed * dt;
            if (uiOpacity.opacity > this.end) {
                uiOpacity.opacity = this.end;
            }
        } else if (this.speed < 0) {
            uiOpacity.opacity += this.speed * dt;
            if (uiOpacity.opacity < this.end) {
                uiOpacity.opacity = this.end;
            }
        }
        if (uiOpacity.opacity == this.end) {
            this.drawing = false;
        }
    }
}
