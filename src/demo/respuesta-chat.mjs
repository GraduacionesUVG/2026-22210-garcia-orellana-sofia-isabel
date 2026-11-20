import { randomUUID } from 'node:crypto';

export function chatResponse(text) {
  const id = randomUUID();
  const frames = [
    { type: 'start', messageId: randomUUID() },
    { type: 'text-start', id },
    { type: 'text-delta', id, delta: text },
    { type: 'text-end', id },
    { type: 'finish' },
  ];
  const events = frames.map(frame => 'data: ' + JSON.stringify(frame));
  events.push('data: [DONE]');
  return new Response(events.join('\n\n') + '\n\n', {
    headers: {
      'content-type': 'text/event-stream',
      'x-vercel-ai-ui-message-stream': 'v1',
      'cache-control': 'no-store',
    },
  });
}
