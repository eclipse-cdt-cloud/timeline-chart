export interface TimeGraphRange {
    start: number
    end: number
}

export interface TimeGraphModel {
    id: string
    // what is this? A range is usually an interval with start and end. Consider rename
    totalRange: number
    rows: TimeGraphRowModel[]
    arrows: TimeGraphArrow[]
}

export interface TimeGraphRowModel {
    id: number
    name: string
    range: TimeGraphRange
    states: TimeGraphRowElementModel[]
    selected?: boolean
    readonly data?: {[key:string]:any}
}

export interface TimeGraphRowElementModel {
    readonly id: string
    readonly range: TimeGraphRange
    readonly label: string
    selected?: boolean
    readonly data?: {[key:string]:any}
}

export interface TimeGraphArrow {
    sourceId: number
    destinationId: number
    range: TimeGraphRange
    data?: {[key:string]:any}
    // Q: Can I select an arrow?
}