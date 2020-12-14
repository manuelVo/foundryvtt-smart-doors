export const settingsKey = "smart-doors";

function reloadGM() {
	if (game.user.isGM)
		location.reload()
}

export function registerSettings() {
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
	game.settings.register(settingsKey, "doorControlOutline", {
		name: "smart-doors.settings.doorControlOutline.name",
		hint: "smart-doors.settings.doorControlOutline.hint",
		scope: "client",
		config: true,
		type: Boolean,
		default: true,
		onChange: () => location.reload(),
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
