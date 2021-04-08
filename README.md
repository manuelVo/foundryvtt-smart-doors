[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/staebchenfisch)

# Smart Doors
Makes doors smarter. Allows doors to synchronize across multiple scenes and sends chat messages when players try to open locked doors (and also tells you which of the doors).

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/master/src/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

### libWrapper

This module uses the [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping core methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

## Feature overview

### Consistent Door Control Size
![Consistent Door Control Size demonstration](https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/e5b5c336d64f2b379914648f57aa07b6a69aadf1/media/door_control_size.webp)

Door Control icons will be rendered the same size in every scene, regardless of the configured grid size. The size of the icons is configurable.

### Door Control Outline
![Door Control Outline demonstration](https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/3b0018ddf424a2a369273029e0e1184a8bed848c/media/door_control_outline.webp)

Door Control icons will be rendered with an outline to improve their visibility on bright backgrounds.

### Tint Secret Doors
![Tint Secret Doors demonstration](https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/dc5d328cd9bc4a0e2aacc5c86ab59e15739cc6d1/media/tint_secret_doors.webp)

Which where the secret doors again? This tints all secret doors grey in the GM view, allowing to easily differentiate between normal and secret doors.


### Toggle Secret Doors
![Toggle Secret Doors demonstration](https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/da5872042ea81e2f41875a193d161331a81a2b6d/media/secret_door_toggle.webp)

Easily reveal secret doors to players. Ctrl+left click secrets doors to turn them into regular doors. Ctrl+left click can also be done on normal doors to turn them into secret doors. Using this in combination with Tint Secret Doors is recommended so you can actually see what you are doing.


### Locked Door Alerts
![Locked Door Alerts demonstration](https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/360d724240634dbc6cc493a3b62243a8b28b7056/media/locked_door_alert.webp)

Keep everyone informed who tried to open which door. Whenever a player tries to open a door that is locked, a chat message stating that fact will be sent to all players. Additionally the door locked sound will be played for everyone. When the chat message is hovered with the mouse, the door that the player tried to open will be highlighted.

If the GM tries to open a locked door the sound will only played for him and no chat message will be sent.

### Synchronized Doors
![Synchronized Doors demonstration](https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/360d724240634dbc6cc493a3b62243a8b28b7056/media/synchronized_doors.webp)

Keep multiple doors in sync - even across different scenes. Example use cases:
- A tavern has an outdoor and an indoor scene. If a player opens the entrance door on the outdoor map, the entrance door in the indoor map will be opened as well
- An ancient trap that opens the cell of a monster once the door to the treasury is opened.

#### Usage
To set up door synchronization, assign all doors that should be synchronized to the same Synchronization Group. The Synchronization Group can be any text. Doors that have the same Synchronization Group set will be synchronized. This will work across different scenes. At least two doors must be assigned to the same Synchronization Group. If only a single door is assigned to a synchronization group it will behave as any other normal door.

Once a Synchronization Group is set up for multiple doors, simply open/close/lock/unlock one of the doors to achieve the same effect on other doors as well.

## Features ideas
- Attach macros to doors that are being executed when the door is being opened/closed
- Give out keys to players, that allow them to lock/unlock associated doors
- Doors that can only be seen from one side when closed
- Only allow doors to be opened of the character is near
	- Doors that can only be opened from one side

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/manuelVo/foundryvtt-smart-doors/issues ), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).


## Acknowledgements

Bootstrapped with League of Extraordinary FoundryVTT Developers  [foundry-vtt-types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types).

Mad props to the 'League of Extraordinary FoundryVTT Developers' community which helped me figure out a lot.