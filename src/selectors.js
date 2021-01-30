import { createSelector } from 'reselect';

import {
	VisualizationMapCollection
} from './map-data.js';

const selectRawMapData = state => state.data ? state.data.data : [];
const selectCurrentDataIndex = state => 0;

const selectVisualizationMapCollection = createSelector(
	selectRawMapData,
	(rawMapData) => new VisualizationMapCollection(rawMapData)
);

export const selectExpandedCurrentMapData = createSelector(
	selectVisualizationMapCollection,
	selectCurrentDataIndex,
	(visualizationCollection, currentIndex) => {
		const data = visualizationCollection.dataForIndex(currentIndex)
		return data ? data.expandedData : {};
	}
);