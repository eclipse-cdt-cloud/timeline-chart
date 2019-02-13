export namespace TimelineChart {
    export interface TimeGraphRange {
        start: number
        end: number
    }

    export interface TimeGraphModel {
        id: string
        totalLength: number
        rows: TimeGraphRowModel[]
        arrows: TimeGraphArrow[]
        readonly data?: { [key: string]: any }
    }

    export interface TimeGraphRowModel {
        id: number
        name: string
        range: TimeGraphRange
        states: TimeGraphRowElementModel[]
        selected?: boolean
        readonly data?: { [key: string]: any }
    }

    export interface TimeGraphRowElementModel {
        readonly id: string
        readonly range: TimeGraphRange
        readonly label: string
        selected?: boolean
        readonly data?: { [key: string]: any }
    }

    export interface TimeGraphArrow {
        sourceId: number
        destinationId: number
        range: TimeGraphRange
        data?: { [key: string]: any }
        // Q: Can I select an arrow?
    }
}
