"use strict";

import * as DoorControlIconScale from "./features/door_control_icon_scale.js"
import * as DoorControlOutline from "./features/door_control_outline.js"
import * as HighlightSecretDoors from "./features/highlight_secret_doors.js"
import * as LockedDoorAlert from "./features/locked_door_alert.js"
import * as SynchronizedDoors from "./features/synchronized_doors.js"
import * as ToggleSecretDoor from "./features/toggle_secret_door.js"

import {performMigrations} from "./migration.js"
import {registerSettings, settingsKey} from "./settings.js"

Hooks.once("init", () => {
	registerSettings()
	hookDoorEvents()
	hookWallConfigUpdate()
	hookDoorControlDraw()
	DoorControlIconScale.hookDoorControlReposition()
})

Hooks.once("ready", () => {
	performMigrations()
})

Hooks.on("renderChatMessage", LockedDoorAlert.onRenderChatMessage)

Hooks.on("canvasReady", DoorControlIconScale.onCanvasReady)
Hooks.on("canvasReady", HighlightSecretDoors.onCanvasReady)

Hooks.on("updateWall", HighlightSecretDoors.onUpdateWall)

// Inject our custom settings into the WallConfig dialog
Hooks.on("renderWallConfig", SynchronizedDoors.onRederWallConfig)

// Hook the update function of the WallConfig dialog so we can store our custom data
function hookWallConfigUpdate() {
	// Replace the original function with our custom one
	const originalHandler = WallConfig.prototype._updateObject;
	WallConfig.prototype._updateObject = async function (event, formData) {
		await originalHandler.call(this, event, formData)
		return SynchronizedDoors.onWallConfigUpdate.call(this, event, formData)
	}
}

function hookDoorControlDraw() {
	const originalHandler = DoorControl.prototype.draw
	DoorControl.prototype.draw = async function () {
		const result = await originalHandler.call(this)
		DoorControlIconScale.onDoorControlPostDraw.call(this)
		DoorControlOutline.onDoorControlPostDraw.call(this)
		return result
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

// Our custom handler for mousedown events on doors
function onDoorMouseDown(event) {
	// If the user doesn't have the "door" permission we don't do anything.
	if (!game.user.can("WALL_DOORS"))
		return false
	// If the game is paused don't do anything if the current player isn't the gm
	if ( game.paused && !game.user.isGM )
		return false

	if (ToggleSecretDoor.onDoorLeftClick.call(this, event))
		return true

	if (LockedDoorAlert.onDoorLeftClick.call(this))
		return true

	if (SynchronizedDoors.onDoorLeftClick.call(this))
		return true

	return false
}

// Our custom handler for rightdown events on doors
function onDoorRightDown(event) {

	if (SynchronizedDoors.onDoorRightClick.call(this))
		return true

	return false
}
