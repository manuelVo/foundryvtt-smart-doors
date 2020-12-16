function formEntry(name, input) {
	return `
		<div class="form-group">
			<label for="${name}">${game.i18n.localize(`smart-doors.ui.form.${name}.name`)}</label>
			${input}
		</div>
		<p class="notes">${game.i18n.localize(`smart-doors.ui.form.${name}.hint`)}</p>
	`
}

export function injectSettings(html, settings) {
	html.find(".form-group").last().after(settings.join(""))
}

export function textInput(name, value) {
	return formEntry(name, `<input type="text" name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}"/>`)
}

export function selectInput(name, values) {
	// TODO Set selected option
	let html = `<select name="${name}">`
	html += values.reduce((html, value) => html + `<option value="${escapeHtml(value)}">${game.i18n.localize(`smart-doors.ui.form.${name}.options.${value}`)}</option>`, "")
	html += "</select>"
	return formEntry(name, html)
}

export function checkboxInput(name, checked) {
	return formEntry(name, `<input type="checkbox" name="${escapeHtml(name)}" value="true" ${checked ? "checked" : ""}/>`)
}

function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
