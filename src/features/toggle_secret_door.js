import {settingsKey} from "../settings.js"
import {updateSynchronizedDoors} from "./synchronized_doors.js";

// Toggles between normal and secret doors
export function onDoorLeftClick(event) {
	// We don't trust the event to be filled with the expected data for compatibilty with arms reach (which passes a broken event)
	if (game.settings.get(settingsKey, "toggleSecretDoors") && event.data?.originalEvent?.ctrlKey && game.user.isGM) {
		const types = CONST.WALL_DOOR_TYPES
		const newtype = this.wall.data.door === types.DOOR ? types.SECRET : types.DOOR
		const updateData = {door: newtype}
		const synchronizationGroup = this.wall.data.flags.smartdoors?.synchronizationGroup
		if (game.settings.get(settingsKey, "synchronizedDoors") && synchronizationGroup && this.wall.data.flags.smartdoors?.synchronizeSecretStatus)
			updateSynchronizedDoors(updateData, synchronizationGroup)
		else
			this.wall.document.update(updateData)

		return true
	}
	return false
}
