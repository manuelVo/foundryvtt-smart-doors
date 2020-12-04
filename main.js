"use strict";

const settingsKey = "smart-doors";

Hooks.once("init", () => {
	registerSettings()
	hookDoorEvents()
})

Hooks.on("renderChatMessage", (message, html, data) => {
	// Tint the door that generated this message
	const sourceId = message.data.flags.smartdoors?.sourceId
	if (!sourceId)
		return

	// Tint on mouse enter
	const mouseEnter = function () {
		canvas.controls.doors.children.find(door => door.wall.data._id == sourceId).icon.tint = 0xff0000;
	}
	html.on("mouseenter", mouseEnter);

	// Remove tint on mouse leave
	const mouseLeave = function () {
		canvas.controls.doors.children.find(door => door.wall.data._id == sourceId).icon.tint = 0xffffff;
	}
	html.on("mouseleave", mouseLeave);
})

function hookDoorEvents() {
	// Replace the original mousedown handler by our custom one
	const originalMouseDownHandler = DoorControl.prototype._onMouseDown
	DoorControl.prototype._onMouseDown = function (event) {
		// Call our handler first. Only allow the original handler to run if our handler returns true
		const continuePropagation = onDoorMousedown.call(this, event)
		if (!continuePropagation)
			return false
		return originalMouseDownHandler.call(this, event)
	}
}


function onDoorMousedown(event) {
	// If the user doesn't have the "door" permission we don't do anything.
	if (!game.user.can("WALL_DOORS"))
		return true
	// If the game is paused don't do anything if the current player isn't the gm
	if ( game.paused && !game.user.isGM )
		return true

	// Create a chat message stating that a player tried to open a locked door
	if (game.settings.get(settingsKey, "lockedDoorAlert")) {
		if (this.wall.data.ds == CONST.WALL_DOOR_STATES.LOCKED && !game.user.isGM) {
			const message = {}
			message.user = game.user;
			message.content = "Just tried to open a locked door"
			message.sound = CONFIG.sounds.lock
			message.flags = {smartdoors: {sourceId: this.wall.data._id}}
			ChatMessage.create(message)
			return false
		}
	}

	return true
}

function registerSettings() {
	game.settings.register(settingsKey, "lockedDoorAlert", {
		name: "smart-doors.settings.lockedDoorAlert.name",
		hint: "smart-doors.settings.lockedDoorAlert.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
	})
}
