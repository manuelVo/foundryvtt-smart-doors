import {settingsKey} from "../settings.js"

// Toggles between normal and secret doors
export function onDoorLeftClick(event) {
	if (event.data.originalEvent.ctrlKey && game.user.isGM && game.settings.get(settingsKey, "toggleSecretDoors")) {
		const types = CONST.WALL_DOOR_TYPES
		const newtype = this.wall.data.door === types.DOOR ? types.SECRET : types.DOOR
		this.wall.update({door: newtype})
		return true
	}
	return false
}
