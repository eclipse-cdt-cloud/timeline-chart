export namespace TestData {
    /**
     * Basic entry interface
     */
    export interface Entry {
        /**
         * Unique Id for the entry
         */
        id: number;

        /**
         * Parent entry Id, or -1 if the entry does not have a parent
         */
        parentId: number;

        /**
         * Array of string that represant the content of each column
         */
        labels: string[];
    }

    /**
     * Entry in a time graph
     */
    export interface TimeGraphEntry extends Entry {
        /**
         * Start time of the entry
         */
        start: number;

        /**
         * End time of the entry
         */
        end: number;

        /**
         * Indicate if the entry will have row data
         */
        hasData: boolean;
    }

    /**
     * Time Graph model that will be returned by the server
     */
    export interface TimeGraphModel {
        rows: TimeGraphRow[];
    }

    /**
     * Time graph row described by an array of states for a specific entry
     */
    export interface TimeGraphRow {
        /**
         * Entry Id associated to the state array
         */
        entryId: number;

        /**
         * Array of states
         */
        states: TimeGraphState[];

        /**
         * Array of markers
         */
        annotations: TimeGraphAnnotation[];
    }

    export interface TimeGraphStateStyle {
        color?: number;
        opacity?: number;
        height?: number;
        borderWidth?: number;
        borderColor?: number;
    }

    /**
     * Time graph state
     */
    export interface TimeGraphState {
        /**
         * Start time of the state
         */
        start: number;

        end: number;

        /**
         * Label to apply to the state
         */
        label?: string | undefined;

        style?: TimeGraphStateStyle;

        /**
         * Values associated to the state
         */
        //value: number;

    }

    /**
      * Time graph state
      */
    export interface TimeGraphAnnotation {
        /**
         * Start time of the state
         */
        startTime: number;

        duration: number;

        /**
         * Label to apply to the state
         */
        label: string | null;
    }

    /**
     * Arrow for time graph
     */
    export interface TimeGraphArrow {
        /**
         * Source entry Id for the arrow
         */
        sourceId: number;

        /**
         * Destination entry Id for the arrow
         */
        destinationId: number;

        /**
         * Start time of the arrow
         */
        startTime: number;

        /**
         * Duration of the arrow
         */
        duration: number;

        /**
         * Value associated to the arrow
         */
        value: number;

        /**
         * Optional information on the style to format this arrow
         */
        style: string;
    }

    export interface TimeGraphPerformanceTestDataModel {
        timeGraphRowIds: any;
        timeGraphEntries: any;
        timeGraphStates: any;
    }

    export interface TimeGraphPerformanceTestDataStub {
        toNextStub(): void;
        getEntries(): TimeGraphEntry[];
        getIds(): number[];
        getRows(): TestData.TimeGraphRow[];
    }
}
