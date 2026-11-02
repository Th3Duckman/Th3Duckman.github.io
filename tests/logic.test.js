import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInterval, matchingCommands, terminalResponse } from '../logic.js';

test('Guardian rejects invalid intervals and values outside the C# int range', () => {
  for (const value of ['', ' ', '0', '-5', '2.5', 'abc', '10abc', '1e3', 'Infinity', '2147483648', '9007199254740993']) {
    assert.equal(validateInterval(value).valid, false, `should reject ${JSON.stringify(value)}`);
  }
  assert.deepEqual(validateInterval(' 25 '), { valid: true, minutes: 25 });
  assert.deepEqual(validateInterval('2147483647'), { valid: true, minutes: 2147483647 });
});

test('command search matches all query words across names and keywords', () => {
  const commands = [{ label: 'Try Guardian', keywords: 'break reminder demo' }, { label: 'Open terminal', keywords: 'console' }];
  assert.equal(matchingCommands(commands, '  GUARDIAN demo ').length, 1);
  assert.equal(matchingCommands(commands, 'terminal console')[0].label, 'Open terminal');
  assert.equal(matchingCommands(commands, 'guardian console').length, 0);
  assert.equal(matchingCommands(commands, '').length, 2);
  assert.equal(matchingCommands([{ label: 'Work', keywords: 'guardian' }, ...commands], 'guardian')[0].label, 'Try Guardian');
});

test('terminal provides factual portfolio content and handles unknown commands as text', () => {
  assert.match(terminalResponse('SKILLS'), /C# \/ .NET · Java/);
  assert.match(terminalResponse('about'), /entry-level/i);
  assert.match(terminalResponse('projects'), /AFK-Guardian/);
  assert.equal(terminalResponse(''), '');
  assert.match(terminalResponse('<script>'), /^Unknown command: <script>/);
});
