import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { User, AuthToken, Session, Letter, Signature } from '../types.js';

const dataDir = process.env.DATA_DIR || './data';
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'openletter.db');
const db: DatabaseType = new Database(dbPath);

db.pragma('journal_mode = WAL');

// --- Schema creation ---

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('login', 'signup')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_md TEXT NOT NULL DEFAULT '',
  authors_json TEXT DEFAULT '[]',
  settings_json TEXT DEFAULT '{"require_verification":true,"show_signature_count":true,"show_view_count":true,"show_signatories":true,"allow_comments":false,"fields":{"name":"required","email":"required","organisation":"optional","role":"optional","location":"hidden"}}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'removed')),
  closing_date TEXT,
  signature_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS signatures (
  id TEXT PRIMARY KEY,
  letter_id TEXT REFERENCES letters(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organisation TEXT,
  role TEXT,
  location TEXT,
  comment TEXT,
  verified INTEGER DEFAULT 0,
  verification_token TEXT,
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  verified_at TEXT,
  UNIQUE(letter_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);
CREATE INDEX IF NOT EXISTS idx_letters_user ON letters(user_id);
CREATE INDEX IF NOT EXISTS idx_letters_slug ON letters(slug);
CREATE INDEX IF NOT EXISTS idx_letters_status ON letters(status);
CREATE INDEX IF NOT EXISTS idx_signatures_letter ON signatures(letter_id);
CREATE INDEX IF NOT EXISTS idx_signatures_verified ON signatures(letter_id, verified);
CREATE INDEX IF NOT EXISTS idx_signatures_token ON signatures(verification_token);
`);

// --- Migrations ---
try { db.exec(`ALTER TABLE users ADD COLUMN tos_accepted_at TEXT`); } catch { /* already exists */ }

// --- Prepared statements ---

// Users
const _getUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const _getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const _createUser = db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?) RETURNING *');

export function getUserById(id: string): User | undefined {
  return _getUserById.get(id) as User | undefined;
}

export function getUserByEmail(email: string): User | undefined {
  return _getUserByEmail.get(email) as User | undefined;
}

export function createUser(id: string, email: string, name?: string): User {
  return _createUser.get(id, email, name ?? null) as User;
}

// Auth tokens
const _createAuthToken = db.prepare(
  `INSERT INTO auth_tokens (id, email, token, type, user_id, expires_at)
   VALUES (?, ?, ?, ?, ?, datetime('now', '+1 hour'))`
);
const _getAuthToken = db.prepare(
  `SELECT * FROM auth_tokens WHERE token = ? AND expires_at > datetime('now') AND used_at IS NULL`
);
const _markTokenUsed = db.prepare(
  `UPDATE auth_tokens SET used_at = datetime('now') WHERE token = ?`
);

export function createAuthToken(
  id: string,
  email: string,
  token: string,
  type: 'login' | 'signup',
  userId?: string
): void {
  _createAuthToken.run(id, email, token, type, userId ?? null);
}

export function getAuthToken(token: string): AuthToken | undefined {
  return _getAuthToken.get(token) as AuthToken | undefined;
}

export function markTokenUsed(token: string): void {
  _markTokenUsed.run(token);
}

// Sessions
const _createSession = db.prepare(
  `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days')) RETURNING *`
);
const _getSession = db.prepare(
  `SELECT s.*, u.email as user_email, u.name as user_name
   FROM sessions s JOIN users u ON s.user_id = u.id
   WHERE s.id = ? AND s.expires_at > datetime('now')`
);
const _deleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');
const _deleteExpiredSessions = db.prepare(`DELETE FROM sessions WHERE expires_at <= datetime('now')`);

export function createSession(id: string, userId: string): Session {
  return _createSession.get(id, userId) as Session;
}

export function getSession(
  id: string
): (Session & { user_email: string; user_name: string | null }) | undefined {
  return _getSession.get(id) as
    | (Session & { user_email: string; user_name: string | null })
    | undefined;
}

export function deleteSession(id: string): void {
  _deleteSession.run(id);
}

export function deleteExpiredSessions(): void {
  _deleteExpiredSessions.run();
}

// Letters
const _getLettersByUser = db.prepare(
  'SELECT * FROM letters WHERE user_id = ? ORDER BY updated_at DESC'
);
const _getLetterById = db.prepare('SELECT * FROM letters WHERE id = ?');
const _getLetterBySlug = db.prepare('SELECT * FROM letters WHERE slug = ?');
const _createLetter = db.prepare(
  `INSERT INTO letters (id, user_id, slug, title, content_md) VALUES (?, ?, ?, ?, ?) RETURNING *`
);
const _deleteLetter = db.prepare('DELETE FROM letters WHERE id = ?');
const _publishLetter = db.prepare(
  `UPDATE letters SET status = 'published', published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
);
const _unpublishLetter = db.prepare(
  `UPDATE letters SET status = 'draft', updated_at = datetime('now') WHERE id = ?`
);
const _closeLetter = db.prepare(
  `UPDATE letters SET status = 'closed', updated_at = datetime('now') WHERE id = ?`
);
const _incrementViewCount = db.prepare(
  'UPDATE letters SET view_count = view_count + 1 WHERE id = ?'
);
const _updateLetterSettings = db.prepare(
  `UPDATE letters SET settings_json = ?, updated_at = datetime('now') WHERE id = ?`
);
const _updateLetterDescription = db.prepare(
  `UPDATE letters SET description = ?, updated_at = datetime('now') WHERE id = ?`
);
const _updateLetterClosingDate = db.prepare(
  `UPDATE letters SET closing_date = ?, updated_at = datetime('now') WHERE id = ?`
);

export function getLettersByUser(userId: string): Letter[] {
  return _getLettersByUser.all(userId) as Letter[];
}

export function getLetterById(id: string): Letter | undefined {
  return _getLetterById.get(id) as Letter | undefined;
}

export function getLetterBySlug(slug: string): Letter | undefined {
  return _getLetterBySlug.get(slug) as Letter | undefined;
}

export function createLetter(
  id: string,
  userId: string,
  slug: string,
  title: string,
  contentMd: string
): Letter {
  return _createLetter.get(id, userId, slug, title, contentMd) as Letter;
}

export function updateLetter(
  id: string,
  data: { title?: string; content_md?: string; authors_json?: string }
): void {
  const fields: string[] = [];
  const values: (string | undefined)[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.content_md !== undefined) {
    fields.push('content_md = ?');
    values.push(data.content_md);
  }
  if (data.authors_json !== undefined) {
    fields.push('authors_json = ?');
    values.push(data.authors_json);
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = datetime('now')`);
  values.push(id);

  db.prepare(`UPDATE letters SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function updateLetterSettings(id: string, settingsJson: string): void {
  _updateLetterSettings.run(settingsJson, id);
}

export function updateLetterDescription(id: string, description: string): void {
  _updateLetterDescription.run(description, id);
}

export function deleteLetter(id: string): void {
  _deleteLetter.run(id);
}

export function publishLetter(id: string): void {
  _publishLetter.run(id);
}

export function unpublishLetter(id: string): void {
  _unpublishLetter.run(id);
}

export function closeLetter(id: string): void {
  _closeLetter.run(id);
}

export function incrementViewCount(id: string): void {
  _incrementViewCount.run(id);
}

export function updateLetterClosingDate(id: string, closingDate: string | null): void {
  _updateLetterClosingDate.run(closingDate, id);
}

// Signatures
const _createSignature = db.prepare(
  `INSERT INTO signatures (id, letter_id, name, email, organisation, role, location, comment, verification_token, ip_hash)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
);
const _getSignatureByToken = db.prepare(
  `SELECT s.*, l.slug as letter_slug FROM signatures s JOIN letters l ON s.letter_id = l.id WHERE s.verification_token = ?`
);
const _getSignatureByEmail = db.prepare(
  'SELECT * FROM signatures WHERE letter_id = ? AND email = ?'
);
const _verifySignature = db.prepare(
  `UPDATE signatures SET verified = 1, verified_at = datetime('now') WHERE verification_token = ?`
);
const _incrementSignatureCount = db.prepare(
  'UPDATE letters SET signature_count = signature_count + 1 WHERE id = (SELECT letter_id FROM signatures WHERE verification_token = ?)'
);
const _deleteSignature = db.prepare('DELETE FROM signatures WHERE id = ? AND letter_id = ?');
const _decrementSignatureCount = db.prepare(
  'UPDATE letters SET signature_count = signature_count - 1 WHERE id = ? AND signature_count > 0'
);
const _getAllSignaturesForExport = db.prepare(
  'SELECT * FROM signatures WHERE letter_id = ? ORDER BY created_at ASC'
);

export function getSignaturesByLetter(
  letterId: string,
  options: { filter?: 'all' | 'verified' | 'pending'; page?: number; perPage?: number } = {}
): Signature[] {
  const filter = options.filter || 'all';
  const page = options.page || 1;
  const perPage = options.perPage || 50;
  const offset = (page - 1) * perPage;

  let where = 'WHERE letter_id = ?';
  if (filter === 'verified') where += ' AND verified = 1';
  else if (filter === 'pending') where += ' AND verified = 0';

  return db
    .prepare(`SELECT * FROM signatures ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(letterId, perPage, offset) as Signature[];
}

export function getSignatureCount(
  letterId: string
): { total: number; verified: number; pending: number } {
  const total = (
    db.prepare('SELECT COUNT(*) as count FROM signatures WHERE letter_id = ?').get(letterId) as {
      count: number;
    }
  ).count;
  const verified = (
    db
      .prepare('SELECT COUNT(*) as count FROM signatures WHERE letter_id = ? AND verified = 1')
      .get(letterId) as { count: number }
  ).count;
  return { total, verified, pending: total - verified };
}

export function getSignaturesTotalPages(
  letterId: string,
  filter: string,
  perPage: number
): number {
  let where = 'WHERE letter_id = ?';
  if (filter === 'verified') where += ' AND verified = 1';
  else if (filter === 'pending') where += ' AND verified = 0';

  const { count } = db
    .prepare(`SELECT COUNT(*) as count FROM signatures ${where}`)
    .get(letterId) as { count: number };

  return Math.max(1, Math.ceil(count / perPage));
}

export function createSignature(data: {
  id: string;
  letter_id: string;
  name: string;
  email: string;
  organisation?: string;
  role?: string;
  location?: string;
  comment?: string;
  verification_token?: string;
  ip_hash?: string;
}): Signature {
  return _createSignature.get(
    data.id,
    data.letter_id,
    data.name,
    data.email,
    data.organisation ?? null,
    data.role ?? null,
    data.location ?? null,
    data.comment ?? null,
    data.verification_token ?? null,
    data.ip_hash ?? null
  ) as Signature;
}

export function getSignatureByToken(
  token: string
): (Signature & { letter_slug: string }) | undefined {
  return _getSignatureByToken.get(token) as
    | (Signature & { letter_slug: string })
    | undefined;
}

export function getSignatureByEmail(letterId: string, email: string): Signature | undefined {
  return _getSignatureByEmail.get(letterId, email) as Signature | undefined;
}

export function verifySignature(token: string): void {
  const verify = db.transaction(() => {
    _verifySignature.run(token);
    _incrementSignatureCount.run(token);
  });
  verify();
}

export function deleteSignature(id: string, letterId: string): void {
  const del = db.transaction(() => {
    const sig = db
      .prepare('SELECT verified FROM signatures WHERE id = ? AND letter_id = ?')
      .get(id, letterId) as { verified: number } | undefined;
    _deleteSignature.run(id, letterId);
    if (sig && sig.verified === 1) {
      _decrementSignatureCount.run(letterId);
    }
  });
  del();
}

export function getAllSignaturesForExport(letterId: string): Signature[] {
  return _getAllSignaturesForExport.all(letterId) as Signature[];
}

// Recent published letters (for landing page)
const _getRecentPublishedLetters = db.prepare(
  `SELECT * FROM letters WHERE status = 'published' ORDER BY published_at DESC LIMIT ?`
);

export function getRecentPublishedLetters(limit: number = 6): Letter[] {
  return _getRecentPublishedLetters.all(limit) as Letter[];
}

// Admin
const _getAllLetters = db.prepare(
  `SELECT l.*, u.email as user_email FROM letters l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC`
);
const _getLetterByIdWithUser = db.prepare(
  `SELECT l.*, u.email as user_email FROM letters l JOIN users u ON l.user_id = u.id WHERE l.id = ?`
);
const _removeLetter = db.prepare(
  `UPDATE letters SET status = 'removed', updated_at = datetime('now') WHERE id = ?`
);
const _hardDeleteLetter = db.prepare('DELETE FROM letters WHERE id = ?');
const _setTosAccepted = db.prepare(
  `UPDATE users SET tos_accepted_at = datetime('now') WHERE id = ?`
);

export function getAllLettersWithUser(): (Letter & { user_email: string })[] {
  return _getAllLetters.all() as (Letter & { user_email: string })[];
}

export function getLetterByIdWithUser(id: string): (Letter & { user_email: string }) | undefined {
  return _getLetterByIdWithUser.get(id) as (Letter & { user_email: string }) | undefined;
}

export function removeLetter(id: string): void {
  _removeLetter.run(id);
}

export function hardDeleteLetter(id: string): void {
  _hardDeleteLetter.run(id);
}

export function setTosAccepted(userId: string): void {
  _setTosAccepted.run(userId);
}

export default db;
