  public async updateNicknameNote(note: string | null, timestamp?: number): Promise<void> {
    const normalizedNote = note === '' ? null : note;
    const currentTimestamp = this.get('nicknameNoteTimestamp') || 0;
    
    if (!timestamp) {
      timestamp = Date.now();
    }

    if (timestamp < currentTimestamp) {
      log.info('updateNicknameNote: Received outdated update, ignoring');
      return;
    }

    if (this.get('nicknameNote') === normalizedNote && currentTimestamp === timestamp) {
      return;
    }

    this.set({ 
      nicknameNote: normalizedNote,
      nicknameNoteTimestamp: timestamp
    });
    await window.Signal.Data.updateConversation(this.attributes);

    this.trigger('change:nicknameNote', this, normalizedNote);
  }
