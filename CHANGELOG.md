## v1.1.0 (in development)
### New features
- Tint secret doors grey for the GM to differentiate them from regular doors
- Toggle doors between secret and normal with ctrl+click
- Makes the size of door controls independent of the scene's grid size

### Bugfixes
- In cloned scenes Locked Door Alerts will now only highlight the door in the correct scene
- When adding a door to a synchronization group it will now assume the correct state if it's being synchronized with it's twin door on a cloned map
- Fixed a bug that allowed synchonized doors to be opened dispite them being locked
- Fixed a bug where secret doors that were synchronized with doors on other scenes wouldn't be tinted corretly after interacting with them

## v1.0.1
- When adding a door to a synchronization group adjust it's state to bring it in sync with the other doors
- Use the players character as speaker for the Locked Door Alert
