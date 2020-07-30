import * as PIXI from "pixi.js";

export class FontController {
    private fontFamily: string;
    private fontNameMap: Map<number, Map<string, string>>;
    private fontColorMap: Map<number, string>;

    constructor(fontFamily: string = "\"Lucida Console\", Monaco, monospace") {
        this.fontFamily = fontFamily;
        this.fontNameMap = new Map<number, Map<string, string>>();
        this.fontColorMap = new Map<number, string>();

        PIXI.BitmapFont.from("LabelFont8Black", { fontFamily: this.fontFamily, fontSize: 8, fill: "black", fontWeight: 900 }, { chars: PIXI.BitmapFont.ASCII });
        PIXI.BitmapFont.from("LabelFont8White", { fontFamily: this.fontFamily, fontSize: 8, fill: "white", fontWeight: 900 }, { chars: PIXI.BitmapFont.ASCII });
        let defaultFontMap = new Map<string, string>();
        defaultFontMap.set("black", "LabelFont8Black");
        defaultFontMap.set("white", "LabelFont8White");
        this.fontNameMap.set(8, defaultFontMap);
    }

    getFontName(color: number, height: number): string {
        let fontColor = this.fontColorMap.get(color);
        if (!fontColor) {
            let colorInHex = color.toString(16);
            for (let i = 0; i < 6 - colorInHex.length; ++i) {
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
        if (height) {
            if (!this.fontNameMap.has(height)) {
                const blackFont = "LabelFont" + height.toString() + "Black";
                const whiteFont = "LabelFont" + height.toString() + "White";
                PIXI.BitmapFont.from(blackFont, { fontFamily: this.fontFamily, fontSize: height, fill: "black", fontWeight: 900 }, { chars: PIXI.BitmapFont.ASCII });
                PIXI.BitmapFont.from(whiteFont, { fontFamily: this.fontFamily, fontSize: height, fill: "white", fontWeight: 900 }, { chars: PIXI.BitmapFont.ASCII });

                let color2FontMap = new Map<string, string>();
                color2FontMap.set("black", blackFont);
                color2FontMap.set("white", whiteFont);
                this.fontNameMap.set(height, color2FontMap);
            }
            const height2FontMap = this.fontNameMap.get(height);
            fontName = height2FontMap ? height2FontMap.get(fontColor) : undefined;
        }
        return fontName ? fontName : "";
    }
}
