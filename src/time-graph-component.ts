export abstract class TimeGraphComponent {

    protected ctx: CanvasRenderingContext2D;

    setContext(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    abstract render(): void;
}