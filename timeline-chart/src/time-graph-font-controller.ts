import * as PIXI from "pixi.js";

export class FontController {
    private fontFamily: string;
    private fontNameMap: Map<number, Map<string, string>>;
    private fontColorMap: Map<number, string>;
    private defaultFontName: string = "LabelFont8White";

    constructor(fontFamily: string = "Verdana") {
        this.fontFamily = fontFamily;
        this.fontNameMap = new Map<number, Map<string, string>>();
        this.fontColorMap = new Map<number, string>();

        const defaultFontSize = 8;
        this.updateFontNameMap(defaultFontSize);
    }

    getDefaultFontName(): string {
        return this.defaultFontName;
    }

    createFontName(fontColor: string, fontSize: number): string {
        const fontName = "LabelFont" + fontSize.toString() + fontColor;
        const fontStyle = new PIXI.TextStyle({
            fontFamily: this.fontFamily,
            fontSize: fontSize,
            fill: fontColor === "White" ? "white" : "black",
            fontWeight: '900'
        });
        PIXI.BitmapFont.from(fontName, fontStyle, { chars: PIXI.BitmapFont.ASCII });
        return fontName;
    }

    updateFontNameMap(size: number) {
        let color2FontMap = new Map<string, string>();
        color2FontMap.set("black", this.createFontName("Black", size));
        color2FontMap.set("white", this.createFontName("White", size));
        this.fontNameMap.set(size, color2FontMap);
    }

    getFontName(color: number, size: number): string {
        let fontColor = this.fontColorMap.get(color);
        if (!fontColor) {
            let colorInHex = color.toString(16);
            const numZeros = 6 - colorInHex.length;
            for (let i = 0; i < numZeros; ++i) {
                colorInHex = "0" + colorInHex;
            }
            const result = /([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorInHex);
            const r = (parseInt(result ? result[1] : "ff", 16)) / 255;
            const g = (parseInt(result ? result[2] : "ff", 16)) / 255;
            const b = (parseInt(result ? result[3] : "ff", 16)) / 255;

            if ((0.2126 * Math.pow(r, 2.2) + 0.7152 * Math.pow(g, 2.2) + 0.0722 * Math.pow(b, 2.2)) <= Math.pow(0.5, 2.2)) {
                fontColor = "white";
            }
            else {
                fontColor = "black";
            }
            this.fontColorMap.set(color, fontColor);
        }

        let fontName: string | undefined;
        if (size) {
            const MIN_FONT_SIZE = 6;
            size = Math.max(size, MIN_FONT_SIZE);
            if (!this.fontNameMap.has(size)) {
                this.updateFontNameMap(size);
            }
            const size2FontMap = this.fontNameMap.get(size);
            fontName = size2FontMap ? size2FontMap.get(fontColor) : undefined;
        }
        return fontName ? fontName : "";
    }
}
