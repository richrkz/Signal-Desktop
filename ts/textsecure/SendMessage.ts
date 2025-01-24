  public async syncNicknameNote(options: {
    conversationId: string;
    note: string | null;
    timestamp: number;
  }): Promise<void> {
    const { conversationId, note, timestamp } = options;

    if (!this.syncMessageSender) {
      throw new Error('syncNicknameNote: syncMessageSender is not available!');
    }

    const conversation = window.ConversationController.get(conversationId);
    if (!conversation) {
      throw new Error(`syncNicknameNote: Conversation ${conversationId} not found`);
    }

    const sendOptions = await getSendOptions(conversation.attributes);
    const proto = new Proto.SyncMessage.NicknoteNote();
    proto.conversationId = conversationId;
    proto.note = note === '' ? null : note;
    proto.timestamp = timestamp;

    const syncMessage = new Proto.SyncMessage();
    syncMessage.nicknoteNote = proto;

    await this.sendSyncMessage(syncMessage, sendOptions);
  }
