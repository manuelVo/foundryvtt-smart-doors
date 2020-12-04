"use strict";

const settingsKey = "smart-doors";
const currentDataVersion = "1.0.0"

Hooks.once("init", () => {
	registerSettings()
	hookDoorEvents()
	hookWallConfigUpdate()
})

Hooks.once("ready", () => {
	performMigrations()
})

// Tint the source door red when a locked alert is hovered
Hooks.on("renderChatMessage", (message, html, data) => {
	// Tint the door that generated this message
	const sourceId = message.data.flags.smartdoors?.sourceId
	if (!sourceId)
		return

	// Tint on mouse enter
	const mouseEnter = function () {
		const sourceDoor = canvas.controls.doors.children.find(door => door.wall.data._id == sourceId);
		if (sourceDoor)
			sourceDoor.icon.tint = 0xff0000;
	}
	html.on("mouseenter", mouseEnter);

	// Remove tint on mouse leave
	const mouseLeave = function () {
		const sourceDoor = canvas.controls.doors.children.find(door => door.wall.data._id == sourceId);
		if (sourceDoor)
			sourceDoor.icon.tint = 0xffffff;
	}
	html.on("mouseleave", mouseLeave);
})

// Inject our custom settings into the WallConfig dialog
Hooks.on("renderWallConfig", (wallConfig, html, data) => {
	// Settings for synchronized doors
	if (data.isDoor && game.settings.get(settingsKey, "synchronizedDoors")) {
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
})

// Hook the update function of the WallConfig dialog so we can store our custom data
function hookWallConfigUpdate() {
	// Replace the original function with our custom one
	const originalHandler = WallConfig.prototype._updateObject;
	WallConfig.prototype._updateObject = async function (event, formData) {
		await originalHandler.call(this, event, formData)
		return onWallConfigUpdate.call(this, event, formData)
	}
}

// Store our custom data from the WallConfig dialog
async function onWallConfigUpdate(event, formData) {
	// TODO Bring newly merged doors in sync
	const updateData = {flags: {smartdoors: {synchronizationGroup: formData.synchronizationGroup}}}

	const ids = this.options.editTargets;
	if (ids.length > 0) {
		// Multiple walls are edited at once. Update all of them
		const updateDataset = ids.reduce((dataset, id) => {
			dataset.push({_id: id, ...updateData})
			return dataset
		}, [])
		return canvas.scene.updateEmbeddedEntity("Wall", updateDataset)
	}
	else {
		// Only one wall is being edited
		return this.object.update(updateData);
	}
}

// Hook mouse events on DoorControls to perform our logic.
// If we successfully handled the event block the original handler. Forward the event otherwise.
function hookDoorEvents() {
	// Replace the original mousedown handler with our custom one
	const originalMouseDownHandler = DoorControl.prototype._onMouseDown
	DoorControl.prototype._onMouseDown = function (event) {
		// Call our handler first. Only allow the original handler to run if our handler returns true
		const eventHandled = onDoorMouseDown.call(this, event)
		if (eventHandled)
			return
		return originalMouseDownHandler.call(this, event)
	}

	// Replace the original rightdown handler with our custom one
	const originalRightDownHandler = DoorControl.prototype._onRightDown
	DoorControl.prototype._onRightDown = function (event) {
		// Call our handler first. Only allow the original handler to run if our handler returns true
		const eventHandled = onDoorRightDown.call(this, event)
		if (eventHandled)
			return
		return originalRightDownHandler.call(this, event)
	}
}

// Searches through all scenes for walls and returns those that match the given filter criteria.
function filterAllWalls(filterFn) {
	return game.scenes.map((scene) => {return {scene: scene, walls: scene.data.walls.filter(filterFn)}});
}

// Our custom handler for mousedown events on doors
function onDoorMouseDown(event) {
	// If the user doesn't have the "door" permission we don't do anything.
	if (!game.user.can("WALL_DOORS"))
		return false
	// If the game is paused don't do anything if the current player isn't the gm
	if ( game.paused && !game.user.isGM )
		return false

	if (lockedDoorAlertLeftClick.call(this))
		return true

	if (synchronizedDoorsLeftClick.call(this))
		return true

	return false
}

// Our custom handler for rightdown events on doors
function onDoorRightDown(event) {
	if (synchronizedDoorsRightClick.call(this))
		return true

	return false
}

// Creates a chat message stating that a player tried to open a locked door
function lockedDoorAlertLeftClick() {
	const state = this.wall.data.ds
	const states = CONST.WALL_DOOR_STATES

	// Check if this feature is enabled
	if (!game.settings.get(settingsKey, "lockedDoorAlert"))
		return false

	// Only create messages when the door is locked.
	if (state != states.LOCKED)
		return false

	// Generate no message if the gm attempts to open the door
	if (game.user.isGM)
		return false

	// Create and send the chat message
	const message = {}
	message.user = game.user;
	message.content = "Just tried to open a locked door"
	message.sound = CONFIG.sounds.lock
	message.flags = {smartdoors: {sourceId: this.wall.data._id}}
	ChatMessage.create(message)
	return true
}

// Updates all doors in the specified synchronization group with the provided data
function updateSynchronizedDoors(updateData, synchronizationGroup) {
	// Search for doors belonging to the synchronization group in all scenes
	let scenes = filterAllWalls(wall => wall.door && wall.flags.smartdoors?.synchronizationGroup == synchronizationGroup);

	// Update all doors in the synchronization group
	scenes.forEach((scene) => {
		scene.scene.updateEmbeddedEntity("Wall", scene.walls.map((wall) => {return {_id: wall._id, ...updateData}}))
	})
}

// Update the state of all synchronized doors
function synchronizedDoorsLeftClick() {
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
	if (this.state === states.LOCKED)
		return false

	// Calculate new door state
	const newstate = state === states.CLOSED ? states.OPEN : states.CLOSED

	// Update all doors belonging to the synchronization group
	const updateData = {ds: newstate}
	updateSynchronizedDoors(updateData, synchronizationGroup)

	return true
}

function synchronizedDoorsRightClick() {
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

function performMigrations() {
	const dataVersion = game.settings.get(settingsKey, "dataVersion")
	if (dataVersion === "fresh install")
	{
		game.settings.set(settingsKey, "dataVersion", currentDataVersion);
		return;
	}
	if (dataVersion != currentDataVersion)
		ui.notifications.error(game.i18n.localize("smart-doors.ui.messages.unknownVersion"), {permanent: true})
}

function registerSettings() {
	game.settings.register(settingsKey, "dataVersion", {
		scope: "world",
		config: false,
		type: String,
		default: "fresh install"
	})
	game.settings.register(settingsKey, "lockedDoorAlert", {
		name: "smart-doors.settings.lockedDoorAlert.name",
		hint: "smart-doors.settings.lockedDoorAlert.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
	})
	game.settings.register(settingsKey, "synchronizedDoors", {
		name: "smart-doors.settings.synchronizedDoors.name",
		hint: "smart-doors.settings.synchronizedDoors.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
	})
}
