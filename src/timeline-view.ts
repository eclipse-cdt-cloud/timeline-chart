export class TimelineView {
    constructor(id: string) {
        const container = document.getElementById(id);
        if (container) {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            canvas.id = id + '_time-line-view-canvas';
            canvas.className = 'timeline-canvas';
            container.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = "rgb(34, 222, 56)";
                ctx.fillRect(20,20,160,160);
            };
        } else {
            throw (`No container with id ${id} available.`);
        }
    }
}