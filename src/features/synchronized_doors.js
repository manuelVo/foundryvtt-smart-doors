import {settingsKey} from "../settings.js"
import * as Util from "../util.js"

// Inject settings for synchronized doors
export function onRederWallConfig(wallConfig, html, data) {
	if (game.settings.get(settingsKey, "synchronizedDoors") && data.isDoor) {
		// Inject settings
		const synchronizedSettings = `
			<p class="notes">${game.i18n.localize("smart-doors.ui.synchronizedDoors.description")}</p>
			<div class="form-group">
				<label for="synchronizationGroup">${game.i18n.localize("smart-doors.ui.synchronizedDoors.groupName")}</label>
				<input type="text" name="synchronizationGroup"/>
			</div>
		`
		html.find(".form-group").last().after(synchronizedSettings)

		const smartdoorsData = data.object.flags.smartdoors
		// Fill the injected input fields with values
		const input = (name) => html.find(`input[name="${name}"]`)
		input("synchronizationGroup").prop("value", smartdoorsData?.synchronizationGroup)

		// Recalculate config window height
		wallConfig.setPosition({height: "auto"})
	}
}

// Store our custom data from the WallConfig dialog
export async function onWallConfigUpdate(event, formData) {
	const updateData = {flags: {smartdoors: {synchronizationGroup: formData.synchronizationGroup}}}
	let ids = this.options.editTargets;
	if (ids.length == 0) {
		ids = [this.object.data._id];
	}

	// If a synchronization group is set, get the state of existing doors and assume their state
	if (formData.synchronizationGroup) {
		// Search for other doors in the synchronization group that aren't in the list of edited doors
		const doorInGroup = Util.findInAllWalls(wall => {
			// We only search for doors
			if (!wall.door)
				return false
			// We only want doors in the same synchronization group
			if (wall.flags.smartdoors?.synchronizationGroup !== formData.synchronizationGroup)
				return false
			// Doors on this scene that have their id included in `ids` are currently being changed. Ignore them.
			if (wall.scene === canvas.scene && ids.includes(wall._id))
				return false
			return true
		})
		if (doorInGroup)
			updateData.ds = doorInGroup.ds;
	}

	// Update all the edited walls
	const updateDataset = ids.reduce((dataset, id) => {
		dataset.push({_id: id, ...updateData})
		return dataset
	}, [])
	return canvas.scene.updateEmbeddedEntity("Wall", updateDataset)
}

// Update the state of all synchronized doors
export function onDoorLeftClick() {
	const state = this.wall.data.ds
	const states = CONST.WALL_DOOR_STATES

	// Check if this feature is enabled
	if (!game.settings.get(settingsKey, "synchronizedDoors"))
		return false

	const synchronizationGroup = this.wall.data.flags.smartdoors?.synchronizationGroup

	// Does this door have a synchronization group? If not there is nothing to do
	if (!synchronizationGroup)
		return false

	// If the door is locked there is nothing to synchronize
	if (state === states.LOCKED)
		return false

	// Calculate new door state
	const newstate = state === states.CLOSED ? states.OPEN : states.CLOSED

	// Update all doors belonging to the synchronization group
	const updateData = {ds: newstate}
	updateSynchronizedDoors(updateData, synchronizationGroup)

	return true
}

export function onDoorRightClick() {
	const state = this.wall.data.ds
	const states = CONST.WALL_DOOR_STATES

	// Check if this feature is enabled
	if (!game.settings.get(settingsKey, "synchronizedDoors"))
		return false

	const synchronizationGroup = this.wall.data.flags.smartdoors?.synchronizationGroup

	// Does this door have a synchronization group? If not there is nothing to do
	if (!synchronizationGroup)
		return false

	// Only the gm is allowed to lock/unlock doors
	if ( !game.user.isGM )
		return false;

	// If the door is currently opened we cannot lock the door
	if ( state === states.OPEN )
		return false;

	// Calculate new door state
	const newstate = state === states.LOCKED ? states.CLOSED : states.LOCKED;

	// Update all doors belonging to the synchronization group
	const updateData = {ds: newstate}
	updateSynchronizedDoors(updateData, synchronizationGroup)

	return true
}

// Updates all doors in the specified synchronization group with the provided data
async function updateSynchronizedDoors(updateData, synchronizationGroup) {
	// Search for doors belonging to the synchronization group in all scenes
	let scenes = Util.filterAllWalls(wall => wall.door && wall.flags.smartdoors?.synchronizationGroup === synchronizationGroup);

	// Update all doors in the synchronization group
	for (const scene of scenes) {
		// When VFTT 0.8 is out look for a way to do this in a single call.
		await scene.scene.updateEmbeddedEntity("Wall", scene.walls.map((wall) => {return {_id: wall._id, ...updateData}}))
	}
}
