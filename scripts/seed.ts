import * as db from '../src/lib/db.js';
import { generateId } from '../src/lib/nanoid.js';

const userId = generateId();
db.createUser(userId, 'test@example.com', 'Test User');

const sessionId = generateId(32);
db.createSession(sessionId, userId);

const letterId = generateId();
db.createLetter(
  letterId,
  userId,
  'test-open-letter',
  'A Test Open Letter',
  `## Dear World

This is a test letter to check the layout and styling of the public letter page.

**We believe** that open letters should be beautiful, well-typeset, and easy to read. The editorial design should make every letter feel important and worthy of attention.

This platform enables anyone to:

- Write compelling open letters
- Collect verified signatures
- Share their message with the world

> The pen is mightier than the sword, but only when the words are well-presented.

Sincerely,
The OpenLetter Team`
);
db.publishLetter(letterId);

console.log('Seed complete!');
console.log('Session cookie:', sessionId);
console.log('Letter slug: test-open-letter');
