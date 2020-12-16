import {settingsKey} from "../settings.js"
import {textInput, checkboxInput, injectSettings} from "../form.js"

// Inject settings for synchronized doors
export function onRederWallConfig(wallConfig, html, data) {
	if (data.isDoor && game.settings.get(settingsKey, "macros")) {

		const settings = [
			textInput("macroName", data.object.flags.smartdoors?.macro?.name),
			textInput("macroArguments", JSON.stringify(data.object.flags.smartdoors?.macro?.args ?? undefined)),
			checkboxInput("macroExecuteEverywhere", data.object.flags.smartdoors?.macro?.executeEverywhere),
		]

		injectSettings(html, settings)
	}
}

// Check data input by the user for validity
export async function onWallConfigPreUpdate(event, formData) {
	const args = formData.macroArguments || "null"

	try {
		// Check if args can be converted to JSON
		JSON.parse(args)
	}
	catch (error) {
		ui.notifications.error(game.i18n.localize("smart-doors.ui.messages.argsInvalidJson"))
		// Rethrow the error to stop the update and prevent the dialog from closing
		throw(error)
	}

	// The JSON is valid. Assign "null" instead of an empty string if necessary
	formData.macroArguments = args
}

// Store our custom data from the WallConfig dialog
export async function onWallConfigUpdate(event, formData) {
	let ids = this.options.editTargets;
	if (ids.length == 0) {
		ids = [this.object.data._id];
	}

	const updateData = {flags: {smartdoors: {macro: {
		name: formData.macroName,
		args: JSON.parse(formData.macroArguments),
		executeEverywhere: formData.macroExecuteEverywhere
	}}}}

	// Update all the edited walls
	const updateDataset = ids.reduce((dataset, id) => {
		dataset.push({_id: id, ...updateData})
		return dataset
	}, [])
	return canvas.scene.updateEmbeddedEntity("Wall", updateDataset)
}
