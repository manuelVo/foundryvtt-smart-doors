# Smart Doors
Makes doors smarter. Allows doors to synchronize across multiple scenes and sends chat messages when players try to open locked doors (and also tells you which of the doors).

## Feature overview

### Tint Secret Doors
![Tint Secret Doors demonstration](https://raw.githubusercontent.com/manuelVo/foundryvtt-smart-doors/dc5d328cd9bc4a0e2aacc5c86ab59e15739cc6d1/media/tint_secret_doors.webp)

Which where the secret doors again? This tints all secret doors grey in the GM view, allowing to easily differentiate between normal and secret doors.


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

## Planned features
- Attach macros to doors that are being executed when the door is being opened/closed
- Give out keys to players, that allow them to lock/unlock associated doors
- Doors that can only be seen from one side when closed
- Only allow doors to be opened of the character is near
	- Doors that can only be opened from one side
