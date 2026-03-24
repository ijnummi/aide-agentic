import type {
  ClaudeRawEvent,
  ClaudeMessage,
  ClaudeTextBlock,
  ClaudeToolUseBlock,
} from '../../shared/types/claude';

export type ParsedUpdate =
  | { type: 'new_message'; message: ClaudeMessage }
  | { type: 'result'; claudeSessionId: string; cost?: number; isError?: boolean }
  | { type: 'error'; error: string }
  | { type: 'system'; message: string };

export function parseClaudeEvent(rawEvent: ClaudeRawEvent): ParsedUpdate | null {
  if (rawEvent.type === 'system') {
    return {
      type: 'system',
      message: rawEvent.message || rawEvent.subtype,
    };
  }

  if (rawEvent.type === 'assistant') {
    const apiMessage = rawEvent.message;
    const blocks: (ClaudeTextBlock | ClaudeToolUseBlock)[] = [];

    for (const block of apiMessage.content) {
      if (block.type === 'text') {
        blocks.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_use') {
        blocks.push({
          type: 'tool_use',
          toolName: block.name,
          toolId: block.id,
          input: block.input,
          status: 'completed',
        });
      }
    }

    if (blocks.length > 0) {
      return {
        type: 'new_message',
        message: {
          id: apiMessage.id || crypto.randomUUID(),
          role: 'assistant',
          blocks,
          timestamp: Date.now(),
          inputTokens: apiMessage.usage?.input_tokens,
          outputTokens: apiMessage.usage?.output_tokens,
          cacheCreationTokens: apiMessage.usage?.cache_creation_input_tokens,
          cacheReadTokens: apiMessage.usage?.cache_read_input_tokens,
        },
      };
    }
  }

  if (rawEvent.type === 'result') {
    return {
      type: 'result',
      claudeSessionId: rawEvent.session_id,
      cost: rawEvent.total_cost_usd,
      isError: rawEvent.is_error,
    };
  }

  if (rawEvent.type === 'error') {
    return {
      type: 'error',
      error: rawEvent.error.message,
    };
  }

  return null;
}
