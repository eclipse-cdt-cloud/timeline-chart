import { timeGraphEntries } from "./test-entries";
import { timeGraphRowIds } from "./test-ids";
import { timeGraphStates } from "./test-states";
import { timeGraphStates2 } from "./test-states-2";

export const LongRemovalTestData = {
    traceStart: BigInt("1673902683695025022"),
    totalLength: BigInt("3027146240"),
    // The view range to set the time graph chart to before the zoom in absolute value
    viewRange: {
        start: BigInt("1673902684100000000") - BigInt("1673902683695025022"),
        end: BigInt("1673902684200000000") - BigInt("1673902683695025022")
    },
    // The view range post zooming is applied, logical time
    zoomRange: {
        start: BigInt("414974978"), 
        end: BigInt("424974978")
    },
    data: [
        {
            timeGraphEntries: timeGraphEntries,
            timeGraphRowIds: timeGraphRowIds,
            timeGraphStates: timeGraphStates
        },
        {
            timeGraphEntries: timeGraphEntries,
            timeGraphRowIds: timeGraphRowIds,
            timeGraphStates: timeGraphStates2
        }
    ]
}
