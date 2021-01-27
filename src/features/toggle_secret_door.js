import {settingsKey} from "../settings.js"

// Toggles between normal and secret doors
export function onDoorLeftClick(event) {
	if (game.settings.get(settingsKey, "toggleSecretDoors") && event.data.originalEvent.ctrlKey && game.user.isGM) {
		const types = CONST.WALL_DOOR_TYPES
		const newtype = this.wall.data.door === types.DOOR ? types.SECRET : types.DOOR
		this.wall.update({door: newtype})
		return true
	}
	return false
}
