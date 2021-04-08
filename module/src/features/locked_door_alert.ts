import {settingsKey} from "../settings.js"

// Tint the source door red when a locked alert is hovered
export function onRenderChatMessage(message, html, data) {
	// Tint the door that generated this message
	const source = message.data.flags.smartdoors?.source
	if (!source)
		return

	// Tint on mouse enter
	const mouseEnter = function () {
		const sourceDoor = canvas.controls.doors.children.find(door => door.wall.data._id === source.wall && door.wall.scene.id === source.scene);
		if (sourceDoor)
			sourceDoor.icon.tint = 0xff0000;
	}
	html.on("mouseenter", mouseEnter);

	// Remove tint on mouse leave
	const mouseLeave = function () {
		const sourceDoor = canvas.controls.doors.children.find(door => door.wall.data._id === source.wall && door.wall.scene.id === source.scene);
		if (sourceDoor)
			sourceDoor.icon.tint = 0xffffff;
	}
	html.on("mouseleave", mouseLeave);
}

// Creates a chat message stating that a player tried to open a locked door
export function onDoorLeftClick() {
	// Check if this feature is enabled
	if (!game.settings.get(settingsKey, "lockedDoorAlert"))
		return false

	const state = this.wall.data.ds
	const states = CONST.WALL_DOOR_STATES

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
	message.flags = {smartdoors: {source: {wall: this.wall.data._id, scene: this.wall.scene.id}}}
	ChatMessage.create(message)
	return true
}
