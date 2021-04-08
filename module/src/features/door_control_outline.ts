import {settingsKey} from "../settings.js"
import {OutlineFilter} from "../../lib/outline_filter/outline_filter.js"

export function onDoorControlPostDraw() {
	if (!game.settings.get(settingsKey, "doorControlOutline"))
		return

	const types = CONST.WALL_DOOR_TYPES
	if (this.wall.data.door === types.NONE)
		return

	// Remove all OutlineFilters from current filters
	let pixiFilters = this.icon.filters || []
	pixiFilters = pixiFilters.filter(pixiFilter => !(pixiFilter instanceof OutlineFilter))

	let outlineFilter;
	if (this.wall.data.door === types.SECRET && game.settings.get(settingsKey, "highlightSecretDoors"))
		outlineFilter = new OutlineFilter(1, 0xFFFFFF)
	else
		outlineFilter = new OutlineFilter(1, 0x000000)

	pixiFilters.push(outlineFilter)
	this.icon.filters = pixiFilters
}
