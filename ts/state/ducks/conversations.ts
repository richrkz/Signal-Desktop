// Updated action creator with error handling and logging
export function updateNicknameNote(conversationId: string, note: string | null) {
  return async (dispatch, getState) => {
    const timestamp = Date.now();

    try {
      // Dispatch the local update
      dispatch({
        type: UPDATE_NICKNAME_NOTE,
        payload: { conversationId, note, timestamp },
      });

      // Get the conversation
      const conversation = window.ConversationController.get(conversationId);
      if (!conversation) {
        throw new Error(`updateNicknameNote: Conversation ${conversationId} not found`);
      }

      // Update the conversation model
      await conversation.updateNicknameNote(note, timestamp);

      // Sync the change
      await conversation.queueJob('updateNicknameNote', async () => {
        await window.Signal.Data.updateConversation(conversation.attributes);
        await window.textsecure.messaging.syncNicknameNote({
          conversationId,
          note,
          timestamp,
        });
      });

      log.info(`Nickname note updated and synced for conversation ${conversationId}`);
    } catch (error) {
      log.error('Failed to update or sync nickname note', Errors.toLogFormat(error));
      // Dispatch an error action if needed
      dispatch({
        type: 'NICKNAME_NOTE_UPDATE_FAILED',
        payload: { conversationId, error: error.message },
      });
    }
  };
}

// Add a new case to the reducer to handle the error action
function conversationReducer(state = getEmptyState(), action: ConversationActionType): ConversationsStateType {
  if (action.type === UPDATE_NICKNAME_NOTE) {
    const { conversationId, note, timestamp } = action.payload;
    const conversation = state.conversationLookup[conversationId];
    if (conversation) {
      return {
        ...state,
        conversationLookup: {
          ...state.conversationLookup,
          [conversationId]: {
            ...conversation,
            nicknameNote: note,
            nicknameNoteTimestamp: timestamp,
          },
        },
      };
    }
  } else if (action.type === 'NICKNAME_NOTE_UPDATE_FAILED') {
    // Handle the error state if needed
    // For now, we'll just log it
    log.error(`Nickname note update failed for conversation ${action.payload.conversationId}: ${action.payload.error}`);
  }
  // ... rest of the reducer
  return state;
}
