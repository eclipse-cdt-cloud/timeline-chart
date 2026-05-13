import { FederatedPointerEvent, FederatedEventTarget } from "@pixi/events";

declare module "@pixi/display" {
    interface DisplayObject {
        interactive: boolean;
        eventMode: import("@pixi/events").EventMode;
        cursor: string;
        buttonMode: boolean;
        hitArea: import("@pixi/events").IHitArea | null;
        on(event: string, fn: Function, context?: any): this;
        off(event: string, fn: Function, context?: any): this;
        once(event: string, fn: Function, context?: any): this;
        emit(event: string, ...args: any[]): boolean;
        addListener(event: string, fn: Function, context?: any): this;
        removeListener(event: string, fn: Function, context?: any): this;
    }
}

declare module "pixi.js-legacy" {
    export { FederatedPointerEvent } from "@pixi/events";
}
