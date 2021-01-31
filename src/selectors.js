import { createSelector } from "reselect";

import {
	VisualizationMapCollection
} from "./map-data.js";

const selectRawMapData = state => state.data ? state.data.data : [];
export const selectRawCurrentDataIndex = state => state.data ? state.data.index : 0;

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

const selectVisualizationMapCollection = createSelector(
	selectRawMapData,
	(rawMapData) => new VisualizationMapCollection(rawMapData)
);

export const selectCurrentDataIndex = createSelector(
	selectRawCurrentDataIndex,
	selectVisualizationMapCollection,
	(rawIndex, collection) => {
		if (rawIndex >= 0) return rawIndex;
		if (collection.length == 0) return 0;
		return collection.length - 1;
	}
);

export const selectMaxLegalIndex = createSelector(
	selectVisualizationMapCollection,
	(collection) => collection.length - 1
);

export const selectExpandedCurrentMapData = createSelector(
	selectVisualizationMapCollection,
	selectCurrentDataIndex,
	(visualizationCollection, currentIndex) => {
		const data = visualizationCollection.dataForIndex(currentIndex);
		return data ? data.expandedData : null;
	}
);