async function handleNicknoteNote(
  nicknameNote: Proto.SyncMessage.INicknoteNote
): Promise<void> {
  const { conversationId, note, timestamp } = nicknameNote;

  if (!conversationId) {
    log.error('handleNicknoteNote: Missing conversationId');
    return;
  }

  if (timestamp == null) {
    log.error('handleNicknoteNote: Missing timestamp');
    return;
  }

  const conversation = window.ConversationController.get(conversationId);
  if (!conversation) {
    log.error(`handleNicknoteNote: Conversation ${conversationId} not found`);
    return;
  }

  const normalizedNote = note === '' ? null : note;
  await conversation.updateNicknameNote(normalizedNote, timestamp);
}

// Add this to the existing processSyncMessage function
export async function processSyncMessage(
  syncMessage: Proto.ISyncMessage
): Promise<void> {
  // ... existing code ...

  if (syncMessage.nicknoteNote) {
    await handleNicknoteNote(syncMessage.nicknoteNote);
    return;
  }

  // ... existing code ...
}
