export namespace TimelineChart {
    export interface TimeGraphRange {
        start: number
        end: number
    }

    export interface TimeGraphModel {
        id: string
        totalLength: number
        rows: TimeGraphRowModel[]
        rangeEvents: TimeGraphAnnotation[]
        arrows: TimeGraphArrow[]
        readonly data?: { [key: string]: any }
    }

    export interface TimeGraphRowModel {
        id: number
        name: string
        range: TimeGraphRange
        states: TimeGraphState[]
        annotations: TimeGraphAnnotation[]
        selected?: boolean
        readonly data?: { [key: string]: any }
        prevPossibleState: number
        nextPossibleState: number
    }

    export interface TimeGraphState {
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

    export interface TimeGraphAnnotation {
        readonly id: string
        readonly range: TimeGraphRange
        readonly label: string
        selected?: boolean
        readonly data?: { [key: string]: any }
    }
}
