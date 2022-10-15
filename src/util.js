// Searches through all scenes for walls and returns those that match the given filter criteria.
export function filterAllWalls(filterFn) {
	// Find all walls that match the filter criteria
	const scenes = game.scenes.map(scene => {
		return {scene: scene, walls: scene.walls.filter(filterFn)};
	});
	// Drop all scenes that don't contain any results
	return scenes.filter(scene => scene.walls.length > 0);
}

// Searches through all scenes for a wall that matches the given filter criteria
export function findInAllWalls(filterFn) {
	// TODO The performance of this could be increased by stopping the search on the first hit
	const scenes = filterAllWalls(filterFn);
	// If results were found take the first wall from the first scene.
	return scenes[0]?.walls[0];
}
