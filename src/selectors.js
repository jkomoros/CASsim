import { createSelector } from "reselect";

import {
	VisualizationMapCollection
} from "./map-data.js";

const selectRawMapData = state => state.data ? state.data.data : [];
export const selectRawCurrentDataIndex = state => state.data ? state.data.index : 0;

export const selectCurrentDataIndex = createSelector(
	selectRawCurrentDataIndex,
	selectRawMapData,
	(rawIndex, mapData) => {
		if (rawIndex >= 0) return rawIndex;
		if (mapData.length == 0) return 0;
		return mapData.length - 1;
	}
);

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

export const selectMaxLegalIndex = createSelector(
	selectRawMapData,
	(rawMapData) => rawMapData.length - 1
);

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