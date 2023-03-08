import { timeGraphEntries } from "./test-entries";
import { timeGraphRowIds } from "./test-ids";
import { timeGraphStates } from "./test-states";

export const WithLabelTestData = {
    traceStart: BigInt("1673902683695025022"),
    totalLength: BigInt("3027146240"),
    // The view range to set the time graph chart to before the zoom in absolute value
    viewRange: {
        start: BigInt("1673902683805000000") - BigInt("1673902683695025022"),
        end: BigInt("1673902683808000000") - BigInt("1673902683695025022")
    },
    // The view range post zooming is applied, logical time
    zoomRange: {
        start: BigInt("3024746189"), 
        end: BigInt("3027146240")
    },
    data: [
        {
            timeGraphEntries: timeGraphEntries,
            timeGraphRowIds: timeGraphRowIds,
            timeGraphStates: timeGraphStates
        }
    ]
}
