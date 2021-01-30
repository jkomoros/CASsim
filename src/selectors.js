import { createSelector } from "reselect";

import {
	VisualizationMapCollection
} from "./map-data.js";

const selectRawMapData = state => state.data ? state.data.data : [];
export const selectRawCurrentDataIndex = state => state.data ? state.data.index : 0;
const selectCurrentDataIndex = state => {
	if (!state.data) return 0;
	const result = selectRawCurrentDataIndex(state);
	if (result < 0) return 0;
	return result;
};
export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

const selectVisualizationMapCollection = createSelector(
	selectRawMapData,
	(rawMapData) => new VisualizationMapCollection(rawMapData)
);

export const selectExpandedCurrentMapData = createSelector(
	selectVisualizationMapCollection,
	selectCurrentDataIndex,
	(visualizationCollection, currentIndex) => {
		const data = visualizationCollection.dataForIndex(currentIndex);
		return data ? data.expandedData : null;
	}
);