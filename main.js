"use strict";

const settingsKey = "smart-doors";
const currentDataVersion = "1.0.0"

Hooks.once("init", () => {
	registerSettings()
	hookDoorEvents()
	hookWallConfigUpdate()
	hookDoorControlDraw()
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

// Adjust the repositioning formula for the door controls
DoorControl.prototype.reposition = function () {
	let gridSize = this.wall.scene.data.grid
	gridSize *= game.settings.get(settingsKey, "doorControlSizeFactor")
	const pos = this.wall.midpoint.map(p => p - gridSize * 0.2)
	this.position.set(...pos)
}

function hookDoorControlDraw() {
	const originalHandler = DoorControl.prototype.draw
	DoorControl.prototype.draw = async function () {
		const result = await originalHandler.call(this)
		onDoorControlPostDraw.call(this)
		return result
	}
}

// Set the size of the door control in relation to the grid size so it'll have a constant percieved size
function onDoorControlPostDraw() {
	// If the canvas isn't ready we'll do this after the "canvasReady" event is fired instead
	if (!canvas.ready)
		return

	fixDoorControlSize(this)
}

// Set the size of all door controls in relation to the grid size so it'll have a constant percieved size
Hooks.on("canvasReady", (currentCanvas, wall, update) => {
	const doors = currentCanvas.controls.doors.children
	doors.forEach(control => fixDoorControlSize(control))
})

// Resizes the door control according to the grid size
function fixDoorControlSize(control) {
	let gridSize = control.wall.scene.data.grid
	gridSize *= game.settings.get(settingsKey, "doorControlSizeFactor")
	control.icon.width = control.icon.height = gridSize * 0.4
	control.hitArea = new PIXI.Rectangle(gridSize * -0.02, gridSize * -0.02, gridSize * 0.44, gridSize * 0.44);
    control.border.clear().lineStyle(1, 0xFF5500, 0.8).drawRoundedRect(gridSize * -0.02, gridSize * -0.02, gridSize * 0.44, gridSize * 0.44, gridSize * 0.05).endFill();
	control.bg.clear().beginFill(0x000000, 1.0).drawRoundedRect(gridSize * -0.02, gridSize * -0.02, gridSize * 0.44, gridSize * 0.44, gridSize * 0.05).endFill();
}

const SECRET_DOOR_TINT = 0x222222

// Tint all secret doors dark grey
Hooks.on("canvasReady", () => {
	if (game.settings.get(settingsKey, "highlightSecretDoors")) {
		const types = CONST.WALL_DOOR_TYPES
		const secretDoors = canvas.controls.doors.children.filter(control => control.wall.data.door == types.SECRET)
		secretDoors.forEach(control => control.icon.tint = SECRET_DOOR_TINT)
	}
})

// If door type has been changed, tint the door accordingly
Hooks.on("updateWall", (scene, wall, update) => {
	if (!game.settings.get(settingsKey, "highlightSecretDoors"))
		return
	const types = CONST.WALL_DOOR_TYPES
	if (wall.door === types.NONE)
		return
	const changedDoor = canvas.controls.doors.children.find(control => control.wall.data._id === wall._id);
	if (wall.door === types.DOOR)
		changedDoor.icon.tint = 0xFFFFFF
	else if (wall.door === types.SECRET)
		changedDoor.icon.tint = SECRET_DOOR_TINT
	else
		console.warn("Smart Doors | Encountered unknown door type " + wall.door + " while highlighting secret doors.")
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
	const updateData = {flags: {smartdoors: {synchronizationGroup: formData.synchronizationGroup}}}
	let ids = this.options.editTargets;
	if (ids.length == 0) {
		ids = [this.object.data._id];
	}

	// If a synchronization group is set, get the state of existing doors and assume their state
	if (formData.synchronizationGroup) {
		const doorInGroup = findInAllWalls(wall => wall.door && wall.flags.smartdoors?.synchronizationGroup == formData.synchronizationGroup && !ids.includes(wall._id));
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
	// Find all walls that match the filter criteria
	const scenes = game.scenes.map((scene) => {return {scene: scene, walls: scene.data.walls.filter(filterFn)}})
	// Drop all scenes that don't contain any results
	return scenes.filter(scene => scene.walls.length > 0)
}

// Searches through all scenes for a wall that matches the given filter criteria
function findInAllWalls(filterFn) {
	// TODO The performance of this could be increased by stopping the search on the first hit
	const scenes = filterAllWalls(filterFn)
	// If results were found take the first wall from the first scene.
	return scenes[0]?.walls[0]
}

// Our custom handler for mousedown events on doors
function onDoorMouseDown(event) {
	// If the user doesn't have the "door" permission we don't do anything.
	if (!game.user.can("WALL_DOORS"))
		return false
	// If the game is paused don't do anything if the current player isn't the gm
	if ( game.paused && !game.user.isGM )
		return false

	if (toggleSecretDoorLeftClick.call(this, event))
		return true

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

// Toggles between normal and secret doors
function toggleSecretDoorLeftClick(event) {
	if (event.data.originalEvent.ctrlKey && game.user.isGM && game.settings.get(settingsKey, "toggleSecretDoors")) {
		const types = CONST.WALL_DOOR_TYPES
		const newtype = this.wall.data.door === types.DOOR ? types.SECRET : types.DOOR
		this.wall.update({door: newtype})
		return true
	}
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
	message.user = game.user
	if (game.user.character)
		message.speaker = {actor: game.user.character}
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

function reloadGM() {
	if (game.user.isGM)
		location.reload()
}

function registerSettings() {
	game.settings.register(settingsKey, "dataVersion", {
		scope: "world",
		config: false,
		type: String,
		default: "fresh install"
	})
	game.settings.register(settingsKey, "doorControlSizeFactor", {
		name: "smart-doors.settings.doorControlSizeFactor.name",
		hint: "smart-doors.settings.doorControlSizeFactor.hint",
		scope: "client",
		config: true,
		type: Number,
		default: 1.5,
		onChange: () => location.reload()
	})
	game.settings.register(settingsKey, "highlightSecretDoors", {
		name: "smart-doors.settings.highlightSecretDoors.name",
		hint: "smart-doors.settings.highlightSecretDoors.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: reloadGM,
	})
	game.settings.register(settingsKey, "toggleSecretDoors", {
		name: "smart-doors.settings.toggleSecretDoors.name",
		hint: "smart-doors.settings.toggleSecretDoors.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
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
