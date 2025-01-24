import { assert } from 'chai';
import * as sinon from 'sinon';
import {
  updateNicknameNote,
  conversationReducer,
} from '../../../state/ducks/conversations';
import { getEmptyState } from '../../../state/ducks/conversations';

describe('conversation duck', () => {
  let sandbox: sinon.SinonSandbox;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    clock = sandbox.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('updateNicknameNote', () => {
    it('should update the nickname note and trigger sync', async () => {
      const dispatch = sinon.spy();
      const getState = sinon.stub().returns({
        conversations: {
          conversationLookup: {
            'conversation-id-1': {
              id: 'conversation-id-1',
              nicknameNote: null,
              nicknameNoteTimestamp: 0,
            },
          },
        },
      });

      const fakeConversation = {
        updateNicknameNote: sinon.stub().resolves(),
        queueJob: sinon.stub().callsFake(async (_, callback) => callback()),
      };

      sandbox.stub(window.ConversationController, 'get').returns(fakeConversation);
      sandbox.stub(window.Signal.Data, 'updateConversation').resolves();
      sandbox.stub(window.textsecure.messaging, 'syncNicknameNote').resolves();

      const now = Date.now();
      clock.tick(now);

      await updateNicknameNote('conversation-id-1', 'New note')(dispatch, getState, null);

      assert.strictEqual(dispatch.callCount, 1);
      assert.deepEqual(dispatch.getCall(0).args[0], {
        type: 'conversations/UPDATE_NICKNAME_NOTE',
        payload: { conversationId: 'conversation-id-1', note: 'New note', timestamp: now },
      });

      assert.strictEqual(fakeConversation.updateNicknameNote.callCount, 1);
      assert.deepEqual(fakeConversation.updateNicknameNote.getCall(0).args, ['New note', now]);

      assert.strictEqual(window.Signal.Data.updateConversation.callCount, 1);
      assert.strictEqual(window.textsecure.messaging.syncNicknameNote.callCount, 1);
      assert.deepEqual(window.textsecure.messaging.syncNicknameNote.getCall(0).args[0], {
        conversationId: 'conversation-id-1',
        note: 'New note',
        timestamp: now,
      });
    });

    it('should handle empty string as null', async () => {
      const dispatch = sinon.spy();
      const getState = sinon.stub().returns({
        conversations: {
          conversationLookup: {
            'conversation-id-1': {
              id: 'conversation-id-1',
              nicknameNote: 'Existing note',
              nicknameNoteTimestamp: 0,
            },
          },
        },
      });

      const fakeConversation = {
        updateNicknameNote: sinon.stub().resolves(),
        queueJob: sinon.stub().callsFake(async (_, callback) => callback()),
      };

      sandbox.stub(window.ConversationController, 'get').returns(fakeConversation);
      sandbox.stub(window.Signal.Data, 'updateConversation').resolves();
      sandbox.stub(window.textsecure.messaging, 'syncNicknameNote').resolves();

      const now = Date.now();
      clock.tick(now);

      await updateNicknameNote('conversation-id-1', '')(dispatch, getState, null);

      assert.strictEqual(dispatch.callCount, 1);
      assert.deepEqual(dispatch.getCall(0).args[0], {
        type: 'conversations/UPDATE_NICKNAME_NOTE',
        payload: { conversationId: 'conversation-id-1', note: null, timestamp: now },
      });

      assert.strictEqual(fakeConversation.updateNicknameNote.callCount, 1);
      assert.deepEqual(fakeConversation.updateNicknameNote.getCall(0).args, [null, now]);
    });
  });

  describe('conversationReducer', () => {
    it('should update the nickname note in the state', () => {
      const initialState = getEmptyState();
      initialState.conversationLookup = {
        'conversation-id-1': {
          id: 'conversation-id-1',
          nicknameNote: null,
          nicknameNoteTimestamp: 0,
        },
      };

      const action = {
        type: 'conversations/UPDATE_NICKNAME_NOTE',
        payload: { conversationId: 'conversation-id-1', note: 'New note', timestamp: 123456789 },
      };

      const newState = conversationReducer(initialState, action);

      assert.strictEqual(
        newState.conversationLookup['conversation-id-1'].nicknameNote,
        'New note'
      );
      assert.strictEqual(
        newState.conversationLookup['conversation-id-1'].nicknameNoteTimestamp,
        123456789
      );
    });

    it('should handle nickname note update failure', () => {
      const initialState = getEmptyState();
      initialState.conversationLookup = {
        'conversation-id-1': {
          id: 'conversation-id-1',
          nicknameNote: 'Existing note',
          nicknameNoteTimestamp: 123456789,
        },
      };

      const action = {
        type: 'NICKNAME_NOTE_UPDATE_FAILED',
        payload: { conversationId: 'conversation-id-1', error: 'Update failed' },
      };

      const newState = conversationReducer(initialState, action);

      // The state should remain unchanged
      assert.deepEqual(newState, initialState);
    });
  });
});

    it('should not update if received timestamp is older', async () => {
      const dispatch = sinon.spy();
      const getState = sinon.stub().returns({
        conversations: {
          conversationLookup: {
            'conversation-id-1': {
              id: 'conversation-id-1',
              nicknameNote: 'Existing note',
              nicknameNoteTimestamp: 200,
            },
          },
        },
      });

      const fakeConversation = {
        updateNicknameNote: sinon.stub().resolves(),
        queueJob: sinon.stub().callsFake(async (_, callback) => callback()),
      };

      sandbox.stub(window.ConversationController, 'get').returns(fakeConversation);
      sandbox.stub(window.Signal.Data, 'updateConversation').resolves();
      sandbox.stub(window.textsecure.messaging, 'syncNicknameNote').resolves();

      clock.tick(100);

      await updateNicknameNote('conversation-id-1', 'Older note')(dispatch, getState, null);

      assert.strictEqual(dispatch.callCount, 1);
      assert.strictEqual(fakeConversation.updateNicknameNote.callCount, 1);
      assert.strictEqual(window.Signal.Data.updateConversation.callCount, 0);
      assert.strictEqual(window.textsecure.messaging.syncNicknameNote.callCount, 0);
    });

    it('should handle network errors during sync', async () => {
      const dispatch = sinon.spy();
      const getState = sinon.stub().returns({
        conversations: {
          conversationLookup: {
            'conversation-id-1': {
              id: 'conversation-id-1',
              nicknameNote: null,
              nicknameNoteTimestamp: 0,
            },
          },
        },
      });

      const fakeConversation = {
        updateNicknameNote: sinon.stub().resolves(),
        queueJob: sinon.stub().callsFake(async (_, callback) => callback()),
      };

      sandbox.stub(window.ConversationController, 'get').returns(fakeConversation);
      sandbox.stub(window.Signal.Data, 'updateConversation').resolves();
      sandbox.stub(window.textsecure.messaging, 'syncNicknameNote').rejects(new Error('Network error'));

      const now = Date.now();
      clock.tick(now);

      await updateNicknameNote('conversation-id-1', 'New note')(dispatch, getState, null);

      assert.strictEqual(dispatch.callCount, 2);
      assert.deepEqual(dispatch.getCall(1).args[0], {
        type: 'NICKNAME_NOTE_UPDATE_FAILED',
        payload: { conversationId: 'conversation-id-1', error: 'Network error' },
      });
    });
