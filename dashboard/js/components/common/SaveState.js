var EventDispatcher = require('../../dispatcher/EventDispatcher');

var SaveState = EventDispatcher.createDispatcher(module.exports, [
    "SaveStateUpdate",
    "CancelDiscardSave",
    "NavigateToClick",
    "ShowSavingModal"
]);

// same as GameStore
SaveState.STATE_SAVING = 0;
SaveState.STATE_SAVED = 1;
SaveState.STATE_DIRTY = 2;
SaveState.STATE_ERROR = 3;

module.exports = SaveState;