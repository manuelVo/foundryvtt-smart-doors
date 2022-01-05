import {settingsKey} from "./settings.js";

export let toggleSecretDoor = false;

export function registerKeybindings() {
	game.keybindings.register(settingsKey, "toggleSecretDoor", {
		name: "smart-doors.keybindings.toggleSecretDoor.name",
		hint: "smart-doors.keybindings.toggleSecretDoor.hint",
		onDown: handleToggleSecretDoor,
		onUp: handleToggleSecretDoor,
		restricted: true,
		editable: [{key: "AltLeft"}],
		precedence: -1,
	});
}

function handleToggleSecretDoor(event) {
	toggleSecretDoor = !event.up;
	return false;
}
