import { strict as assert } from 'node:assert'
import { extractJsonObject, parseAgentApiResult } from '../src/services/agentApi.ts'

const fencedJson = [
  '这里是模型解释。',
  '```json',
  '{"explanations":["ok"],"suggestedActions":[{"id":"a1","label":"Do it","type":"confirm"}]}',
  '```',
].join('\n')

assert.equal(
  extractJsonObject(fencedJson),
  '{"explanations":["ok"],"suggestedActions":[{"id":"a1","label":"Do it","type":"confirm"}]}',
)

assert.deepEqual(parseAgentApiResult(fencedJson), {
  explanations: ['ok'],
  suggestedActions: [{ id: 'a1', label: 'Do it', type: 'confirm' }],
})

assert.deepEqual(parseAgentApiResult('not json'), {
  explanations: ['not json'],
})

assert.deepEqual(
  parseAgentApiResult(
    '{"explanations":[{"title":"why","detail":"because"}],"suggestedActions":[{"label":"Act","type":"confirm"},{"id":"same","label":"Again","type":"confirm"},{"id":"same","label":"Again 2","type":"confirm"}]}',
    'TestAgent',
  ),
  {
    explanations: ['{"title":"why","detail":"because"}'],
    suggestedActions: [
      { id: 'TestAgent-action-0', label: 'Act', type: 'confirm' },
      { id: 'same', label: 'Again', type: 'confirm' },
      { id: 'same-2', label: 'Again 2', type: 'confirm' },
    ],
  },
)
