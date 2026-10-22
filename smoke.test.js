const test = require('node:test');
const assert = require('node:assert/strict');

// Static smoke checks for the deployment package; DB-backed integration tests need PostgreSQL.
const fs = require('node:fs');
const path = require('node:path');
const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const schema = fs.readFileSync(path.join(__dirname, '..', 'db.sql'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

test('API keeps real-money functionality disabled', () => {
  assert.match(server, /REAL_MONEY_ENABLED/);
  assert.match(server, /REAL_MONEY_ENABLED=true is not supported/);
});
test('schema contains the 30/70 contract accounting fields and listing review states', () => {
  assert.match(schema, /commission_coins/);
  assert.match(schema, /provider_coins/);
  assert.match(schema, /needs_changes/);
});
test('interface contains the expected navigation sections', () => {
  for (const label of ['Inicio', 'Explorar', 'Contratos', 'Coins', 'Perfil']) assert.ok(html.includes(label));
});
