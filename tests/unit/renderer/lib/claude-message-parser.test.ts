import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseClaudeEvent } from '../../../../src/renderer/lib/claude-message-parser';
import type { ClaudeRawEvent } from '../../../../src/shared/types/claude';

// crypto.randomUUID is used for assistant messages without an id
beforeEach(() => {
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' });
});

describe('parseClaudeEvent', () => {
  it('parses system events', () => {
    const event = {
      type: 'system',
      subtype: 'init',
      message: 'Session started',
    } as ClaudeRawEvent;

    const result = parseClaudeEvent(event);
    expect(result).toEqual({
      type: 'system',
      message: 'Session started',
    });
  });

  it('falls back to subtype when message is absent', () => {
    const event = {
      type: 'system',
      subtype: 'init',
    } as ClaudeRawEvent;

    const result = parseClaudeEvent(event);
    expect(result).toEqual({
      type: 'system',
      message: 'init',
    });
  });

  it('parses assistant text blocks', () => {
    const event = {
      type: 'assistant',
      message: {
        id: 'msg-1',
        content: [{ type: 'text', text: 'Hello world' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      },
    } as ClaudeRawEvent;

    const result = parseClaudeEvent(event);
    expect(result).toEqual({
      type: 'new_message',
      message: {
        id: 'msg-1',
        role: 'assistant',
        blocks: [{ type: 'text', text: 'Hello world' }],
        timestamp: expect.any(Number),
        inputTokens: 10,
        outputTokens: 5,
        cacheCreationTokens: undefined,
        cacheReadTokens: undefined,
      },
    });
  });

  it('parses assistant tool_use blocks', () => {
    const event = {
      type: 'assistant',
      message: {
        id: 'msg-2',
        content: [{
          type: 'tool_use',
          name: 'Read',
          id: 'tool-1',
          input: { path: '/foo' },
        }],
        usage: {},
      },
    } as ClaudeRawEvent;

    const result = parseClaudeEvent(event);
    expect(result!.type).toBe('new_message');
    if (result!.type === 'new_message') {
      expect(result!.message.blocks[0]).toEqual({
        type: 'tool_use',
        toolName: 'Read',
        toolId: 'tool-1',
        input: { path: '/foo' },
        status: 'completed',
      });
    }
  });

  it('generates uuid when message has no id', () => {
    const event = {
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: 'hi' }],
        usage: {},
      },
    } as ClaudeRawEvent;

    const result = parseClaudeEvent(event);
    if (result!.type === 'new_message') {
      expect(result!.message.id).toBe('test-uuid-1234');
    }
  });

  it('returns null for assistant with empty content', () => {
    const event = {
      type: 'assistant',
      message: {
        id: 'msg-3',
        content: [],
        usage: {},
      },
    } as ClaudeRawEvent;

    expect(parseClaudeEvent(event)).toBeNull();
  });

  it('parses result events', () => {
    const event = {
      type: 'result',
      session_id: 'ses-1',
      total_cost_usd: 0.05,
      is_error: false,
    } as ClaudeRawEvent;

    expect(parseClaudeEvent(event)).toEqual({
      type: 'result',
      claudeSessionId: 'ses-1',
      cost: 0.05,
      isError: false,
    });
  });

  it('parses error events', () => {
    const event = {
      type: 'error',
      error: { message: 'Something broke' },
    } as ClaudeRawEvent;

    expect(parseClaudeEvent(event)).toEqual({
      type: 'error',
      error: 'Something broke',
    });
  });

  it('returns null for unknown event types', () => {
    const event = { type: 'unknown' } as ClaudeRawEvent;
    expect(parseClaudeEvent(event)).toBeNull();
  });
});
