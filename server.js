const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DEMO_MODE = String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true';
const REAL_MONEY_ENABLED = String(process.env.REAL_MONEY_ENABLED || 'false').toLowerCase() === 'true';
const JWT_SECRET = process.env.JWT_SECRET || '';
const OWNER_PHONE = normalizePhone(process.env.OWNER_PHONE || '');
const DATABASE_URL = process.env.DATABASE_URL || '';

if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random secret of at least 32 characters in production.');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required. Configure PostgreSQL locally or on Render before starting.');
  process.exit(1);
}
if (REAL_MONEY_ENABLED) {
  console.error('REAL_MONEY_ENABLED=true is not supported by this build. Keep it false until real payment flows are implemented and reviewed.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  }
}));
app.use(compression());
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });

const CATEGORIES = ['Minecraft', 'Fortnite', 'Warzone', 'Free Fire'];
const LISTING_STATUSES = ['pending', 'approved', 'rejected', 'needs_changes', 'paused'];
const CONTRACT_STATUSES = ['paid_held', 'in_progress', 'delivered', 'completed', 'cancel_requested', 'cancelled', 'disputed', 'under_review', 'appealed', 'refunded'];

function normalizePhone(value) {
  return String(value || '').replace(/[^\d+]/g, '').slice(0, 32);
}
function cleanText(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')) && String(value).length <= 254;
}
function positiveInt(value, max = 1000000000) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= max ? n : null;
}
function publicUser(row) {
  return { id: Number(row.id), phone: row.phone, name: row.name, age: Number(row.age), country: row.country,
    region: row.region, municipality: row.municipality, email: row.email, role: row.role, verified: Boolean(row.verified_at) };
}
function makeToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, JWT_SECRET, { expiresIn: '12h', issuer: 'gamer-marketplace' });
}
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'gamer-marketplace' });
    req.auth = { id: Number(decoded.sub), role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesión vencida o inválida. Inicia sesión de nuevo.' });
  }
}
function staffRequired(req, res, next) {
  if (!req.auth || !['owner', 'admin', 'moderator'].includes(req.auth.role)) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
  }
  next();
}
function ownerRequired(req, res, next) {
  if (!req.auth || req.auth.role !== 'owner') return res.status(403).json({ error: 'Solo el propietario puede realizar esta acción.' });
  next();
}
async function getUser(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
  return rows[0] || null;
}
async function getWallet(id, client = pool) {
  const { rows } = await client.query('SELECT purchased_coins, earned_coins FROM wallets WHERE user_id=$1', [id]);
  return rows[0] || { purchased_coins: 0, earned_coins: 0 };
}
async function addLedger(client, { userId, actorId, type, bucket, amount, reference, reason, key }) {
  await client.query(
    `INSERT INTO ledger_entries(user_id, actor_user_id, entry_type, bucket, amount, reference, reason, idempotency_key)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [userId || null, actorId || null, type, bucket || 'purchased', amount, reference || null, reason, key || null]
  );
}
async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'db.sql'), 'utf8');
  await pool.query(sql);
  if (OWNER_PHONE) {
    await pool.query("UPDATE users SET role='owner' WHERE phone=$1", [OWNER_PHONE]);
  }
}
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }

app.get('/api/health', asyncRoute(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, service: 'gamer-marketplace', mode: DEMO_MODE ? 'demo' : 'sms-not-configured', realMoneyEnabled: false, time: new Date().toISOString() });
}));
app.get('/api/config', (req, res) => {
  res.json({ demoMode: DEMO_MODE, realMoneyEnabled: false, categories: CATEGORIES, commissionPercent: 30,
    coinEquivalenceConfirmed: false, cancellationRulesFinalized: false, withdrawalsEnabled: false,
    note: 'Coins de prueba. No hay cobros ni retiros reales.' });
});

app.post('/api/auth/request-code', authLimiter, asyncRoute(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (phone.length < 8) return res.status(400).json({ error: 'Escribe un número de teléfono válido con código de país.' });
  if (!DEMO_MODE) return res.status(503).json({ error: 'La verificación SMS no está configurada. No se enviará ningún código real.' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await bcrypt.hash(code, 10);
  await pool.query('UPDATE otp_codes SET consumed_at=NOW() WHERE phone=$1 AND consumed_at IS NULL', [phone]);
  await pool.query('INSERT INTO otp_codes(phone, code_hash, expires_at) VALUES($1,$2,NOW() + INTERVAL \'10 minutes\')', [phone, hash]);
  res.json({ ok: true, message: 'Modo de prueba: usa este código únicamente para la demo.', demoCode: code, expiresInSeconds: 600 });
}));

app.post('/api/auth/verify-code', authLimiter, asyncRoute(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || '').trim();
  if (!phone || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Teléfono o código inválido.' });
  const { rows } = await pool.query('SELECT * FROM otp_codes WHERE phone=$1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1', [phone]);
  const otp = rows[0];
  if (!otp || new Date(otp.expires_at) < new Date() || Number(otp.attempts) >= 5) return res.status(400).json({ error: 'El código venció o ya no es válido. Solicita otro.' });
  const match = await bcrypt.compare(code, otp.code_hash);
  if (!match) {
    await pool.query('UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1', [otp.id]);
    return res.status(400).json({ error: 'Código incorrecto.' });
  }
  let { rows: users } = await pool.query('SELECT * FROM users WHERE phone=$1', [phone]);
  let user = users[0];
  if (!user) {
    // Keep the OTP unconsumed until registration completes; otherwise the profile form cannot validate it.
    return res.json({ ok: true, needsProfile: true, phone, message: 'Verificación correcta. Completa tus datos para crear la cuenta.' });
  }
  await pool.query('UPDATE otp_codes SET consumed_at=NOW() WHERE id=$1', [otp.id]);
  await pool.query('UPDATE users SET verified_at=COALESCE(verified_at,NOW()) WHERE id=$1', [user.id]);
  user = await getUser(user.id);
  return res.json({ ok: true, token: makeToken(user), user: publicUser(user) });
}));

app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const name = cleanText(req.body.name, 80);
  const age = Number(req.body.age);
  const country = cleanText(req.body.country, 80);
  const region = cleanText(req.body.region, 80);
  const municipality = cleanText(req.body.municipality, 100);
  const email = cleanText(req.body.email, 254).toLowerCase();
  const code = String(req.body.code || '').trim();
  if (phone.length < 8 || name.length < 2 || !Number.isInteger(age) || age < 18 || age > 120 ||
      !country || !region || !municipality || !validEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Revisa tus datos. Debes tener 18 años o más y completar todos los campos.' });
  }
  if (!DEMO_MODE) return res.status(503).json({ error: 'El registro requiere verificación SMS real, todavía no configurada.' });
  const { rows: otpRows } = await pool.query('SELECT * FROM otp_codes WHERE phone=$1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1', [phone]);
  const otp = otpRows[0];
  if (!otp || new Date(otp.expires_at) < new Date() || Number(otp.attempts) >= 5 || !(await bcrypt.compare(code, otp.code_hash))) {
    if (otp) await pool.query('UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1', [otp.id]);
    return res.status(400).json({ error: 'Verifica el teléfono con un código válido antes de registrarte.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE otp_codes SET consumed_at=NOW() WHERE id=$1', [otp.id]);
    const role = OWNER_PHONE && phone === OWNER_PHONE ? 'owner' : 'user';
    const { rows } = await client.query(
      `INSERT INTO users(phone,name,age,country,region,municipality,email,role,verified_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [phone, name, age, country, region, municipality, email, role]
    );
    const user = rows[0];
    await client.query('INSERT INTO wallets(user_id) VALUES($1)', [user.id]);
    await client.query('COMMIT');
    res.status(201).json({ ok: true, token: makeToken(user), user: publicUser(user) });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe una cuenta con ese teléfono o correo.' });
    throw e;
  } finally { client.release(); }
}));

app.get('/api/me', authRequired, asyncRoute(async (req, res) => {
  const user = await getUser(req.auth.id);
  if (!user) return res.status(401).json({ error: 'Cuenta no encontrada.' });
  const wallet = await getWallet(user.id);
  res.json({ user: publicUser(user), wallet: { purchasedCoins: Number(wallet.purchased_coins), earnedCoins: Number(wallet.earned_coins), totalCoins: Number(wallet.purchased_coins) + Number(wallet.earned_coins) } });
}));

app.get('/api/listings', asyncRoute(async (req, res) => {
  const game = req.query.game ? String(req.query.game) : '';
  const search = cleanText(req.query.q, 100);
  const values = [];
  let where = "l.status='approved'";
  if (game && CATEGORIES.includes(game)) { values.push(game); where += ` AND l.game=$${values.length}`; }
  if (search) { values.push(`%${search}%`); where += ` AND (l.title ILIKE $${values.length} OR l.description ILIKE $${values.length})`; }
  const { rows } = await pool.query(
    `SELECT l.id,l.game,l.title,l.description,l.skill_level,l.deliverables,l.deadline_hours,l.conditions,l.price_coins,l.created_at,u.id seller_id,u.name seller_name
     FROM listings l JOIN users u ON u.id=l.seller_id WHERE ${where} ORDER BY l.created_at DESC LIMIT 100`, values);
  res.json({ listings: rows.map(r => ({ ...r, id: Number(r.id), seller_id: Number(r.seller_id), price_coins: Number(r.price_coins), skill_level: Number(r.skill_level), deadline_hours: Number(r.deadline_hours) })) });
}));

app.post('/api/listings', authRequired, asyncRoute(async (req, res) => {
  const game = cleanText(req.body.game, 40);
  const title = cleanText(req.body.title, 120);
  const description = cleanText(req.body.description, 3000);
  const skill = Number(req.body.skillLevel);
  const deliverables = cleanText(req.body.deliverables, 1500);
  const deadline = Number(req.body.deadlineHours);
  const conditions = cleanText(req.body.conditions, 1500);
  const price = positiveInt(req.body.priceCoins);
  if (!CATEGORIES.includes(game) || title.length < 5 || description.length < 20 || !Number.isInteger(skill) || skill < 1 || skill > 10 ||
      deliverables.length < 5 || !Number.isInteger(deadline) || deadline < 1 || deadline > 2160 || !conditions || !price) {
    return res.status(400).json({ error: 'Completa correctamente todos los campos de la publicación.' });
  }
  const { rows } = await pool.query(
    `INSERT INTO listings(seller_id,game,title,description,skill_level,deliverables,deadline_hours,conditions,price_coins)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,status,created_at`,
    [req.auth.id, game, title, description, skill, deliverables, deadline, conditions, price]);
  res.status(201).json({ ok: true, listing: rows[0], message: 'Publicación enviada a revisión. No será pública hasta que sea aprobada.' });
}));

app.get('/api/listings/mine', authRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM listings WHERE seller_id=$1 ORDER BY created_at DESC LIMIT 100', [req.auth.id]);
  res.json({ listings: rows });
}));

app.get('/api/wallet', authRequired, asyncRoute(async (req, res) => {
  const wallet = await getWallet(req.auth.id);
  const { rows } = await pool.query('SELECT id,entry_type,bucket,amount,reference,reason,created_at FROM ledger_entries WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [req.auth.id]);
  res.json({ wallet: { purchasedCoins: Number(wallet.purchased_coins), earnedCoins: Number(wallet.earned_coins), totalCoins: Number(wallet.purchased_coins) + Number(wallet.earned_coins) }, entries: rows });
}));

app.post('/api/contracts', authRequired, asyncRoute(async (req, res) => {
  const listingId = positiveInt(req.body.listingId);
  if (!listingId) return res.status(400).json({ error: 'Publicación inválida.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: listingRows } = await client.query("SELECT * FROM listings WHERE id=$1 AND status='approved' FOR UPDATE", [listingId]);
    const listing = listingRows[0];
    if (!listing) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'El servicio no existe o no está disponible.' }); }
    if (Number(listing.seller_id) === req.auth.id) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No puedes contratar tu propio servicio.' }); }
    const wallet = await getWallet(req.auth.id, client);
    const available = Number(wallet.purchased_coins) + Number(wallet.earned_coins);
    const price = Number(listing.price_coins);
    if (available < price) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No tienes suficientes Coins para contratar. En esta versión no hay recargas reales.' }); }
    // Spend purchased balance first, then earned balance. Contract payment stays held in the contract record.
    let fromPurchased = Math.min(Number(wallet.purchased_coins), price);
    let fromEarned = price - fromPurchased;
    await client.query('UPDATE wallets SET purchased_coins=purchased_coins-$2, earned_coins=earned_coins-$3, updated_at=NOW() WHERE user_id=$1',
      [req.auth.id, fromPurchased, fromEarned]);
    await addLedger(client, { userId: req.auth.id, actorId: req.auth.id, type: 'contract_hold', bucket: 'purchased', amount: -fromPurchased, reference: `listing:${listingId}`, reason: 'Coins retenidas al contratar el servicio.' });
    if (fromEarned > 0) await addLedger(client, { userId: req.auth.id, actorId: req.auth.id, type: 'contract_hold', bucket: 'earned', amount: -fromEarned, reference: `listing:${listingId}`, reason: 'Coins retenidas al contratar el servicio.' });
    const commission = Math.floor(price * 0.30);
    const provider = price - commission;
    const { rows: contractRows } = await client.query(
      `INSERT INTO contracts(listing_id,buyer_id,seller_id,price_coins,commission_coins,provider_coins,status)
       VALUES($1,$2,$3,$4,$5,$6,'paid_held') RETURNING *`,
      [listingId, req.auth.id, listing.seller_id, price, commission, provider]);
    await client.query('COMMIT');
    res.status(201).json({ ok: true, contract: contractRows[0], message: 'Contrato creado. El pago está retenido y no se ha entregado al proveedor.' });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
}));

app.get('/api/contracts', authRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, l.title listing_title, l.game, b.name buyer_name, s.name seller_name
     FROM contracts c JOIN listings l ON l.id=c.listing_id JOIN users b ON b.id=c.buyer_id JOIN users s ON s.id=c.seller_id
     WHERE c.buyer_id=$1 OR c.seller_id=$1 ORDER BY c.created_at DESC LIMIT 100`, [req.auth.id]);
  res.json({ contracts: rows });
}));

app.post('/api/contracts/:id/start', authRequired, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id);
  const { rows } = await pool.query("UPDATE contracts SET status='in_progress',updated_at=NOW() WHERE id=$1 AND seller_id=$2 AND status='paid_held' RETURNING *", [id, req.auth.id]);
  if (!rows[0]) return res.status(400).json({ error: 'No se pudo iniciar: revisa que seas el proveedor y que el contrato esté pagado y retenido.' });
  res.json({ ok: true, contract: rows[0] });
}));

app.post('/api/contracts/:id/deliver', authRequired, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id);
  const note = cleanText(req.body.note, 2000);
  const evidence = cleanText(req.body.evidence, 1500);
  if (note.length < 10) return res.status(400).json({ error: 'Describe la entrega con al menos 10 caracteres.' });
  const { rows } = await pool.query(
    "UPDATE contracts SET status='delivered',delivery_note=$3,delivery_evidence=$4,delivered_at=NOW(),updated_at=NOW() WHERE id=$1 AND seller_id=$2 AND status IN ('paid_held','in_progress') RETURNING *",
    [id, req.auth.id, note, evidence || null]);
  if (!rows[0]) return res.status(400).json({ error: 'No se pudo marcar la entrega. Comprueba el estado y que seas el proveedor.' });
  res.json({ ok: true, contract: rows[0], message: 'Entrega registrada. El pago sigue retenido hasta confirmación o resolución.' });
}));

app.post('/api/contracts/:id/complete', authRequired, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id);
  const rating = Number(req.body.rating);
  const review = cleanText(req.body.review, 1000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'La calificación debe ser de 1 a 5.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query("SELECT * FROM contracts WHERE id=$1 FOR UPDATE", [id]);
    const contract = rows[0];
    if (!contract || Number(contract.buyer_id) !== req.auth.id || contract.status !== 'delivered') {
      await client.query('ROLLBACK'); return res.status(400).json({ error: 'Solo el cliente puede confirmar una entrega pendiente de confirmación.' });
    }
    const { rows: disputes } = await client.query("SELECT id FROM disputes WHERE contract_id=$1 AND status IN ('open','under_review','appealed')", [id]);
    if (disputes.length) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'El contrato tiene una disputa abierta.' }); }
    const providerWallet = await getWallet(contract.seller_id, client);
    await client.query('UPDATE wallets SET earned_coins=earned_coins+$2, updated_at=NOW() WHERE user_id=$1', [contract.seller_id, contract.provider_coins]);
    await addLedger(client, { userId: contract.seller_id, actorId: req.auth.id, type: 'contract_payout', bucket: 'earned', amount: Number(contract.provider_coins), reference: `contract:${id}`, reason: 'Pago al proveedor por contrato completado.', key: `contract:${id}:payout` });
    await client.query("UPDATE contracts SET status='completed',buyer_review=$2,buyer_review_text=$3,released_at=NOW(),updated_at=NOW() WHERE id=$1", [id, rating, review]);
    await addLedger(client, { userId: null, actorId: req.auth.id, type: 'platform_commission', bucket: 'platform', amount: Number(contract.commission_coins), reference: `contract:${id}`, reason: 'Comisión del 30% de contrato completado.', key: `contract:${id}:commission` });
    await client.query('COMMIT');
    res.json({ ok: true, message: 'Contrato completado y Coins del proveedor liberadas.', commissionCoins: Number(contract.commission_coins), providerCoins: Number(contract.provider_coins) });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

app.post('/api/contracts/:id/disputes', authRequired, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id);
  const reason = cleanText(req.body.reason, 1500);
  const evidence = cleanText(req.body.evidence, 2000);
  if (reason.length < 10) return res.status(400).json({ error: 'Explica el problema con al menos 10 caracteres.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM contracts WHERE id=$1 FOR UPDATE', [id]);
    const contract = rows[0];
    if (!contract || ![Number(contract.buyer_id), Number(contract.seller_id)].includes(req.auth.id) || !['paid_held','in_progress','delivered'].includes(contract.status)) {
      await client.query('ROLLBACK'); return res.status(400).json({ error: 'No puedes abrir una disputa para este contrato.' });
    }
    await client.query("INSERT INTO disputes(contract_id,opened_by,reason,evidence) VALUES($1,$2,$3,$4)", [id, req.auth.id, reason, evidence || null]);
    await client.query("UPDATE contracts SET status='disputed',updated_at=NOW() WHERE id=$1", [id]);
    await client.query('COMMIT');
    res.status(201).json({ ok: true, message: 'Disputa abierta. El pago permanece retenido.' });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

app.post('/api/contracts/:id/cancel-request', authRequired, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id);
  const reason = cleanText(req.body.reason, 1000);
  if (reason.length < 5) return res.status(400).json({ error: 'Indica el motivo de la cancelación.' });
  const { rows } = await pool.query('SELECT * FROM contracts WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)', [id, req.auth.id]);
  const c = rows[0];
  if (!c || !['paid_held','in_progress','delivered'].includes(c.status)) return res.status(400).json({ error: 'No se puede solicitar cancelación en el estado actual.' });
  await pool.query('INSERT INTO cancellation_requests(contract_id,requested_by,reason) VALUES($1,$2,$3)', [id, req.auth.id, reason]);
  await pool.query("UPDATE contracts SET status='cancel_requested',updated_at=NOW() WHERE id=$1", [id]);
  res.status(201).json({ ok: true, message: 'Solicitud enviada para revisión manual. No se ha aplicado ninguna multa ni reembolso automático.' });
}));

app.get('/api/admin/overview', authRequired, staffRequired, asyncRoute(async (req, res) => {
  const [users, listings, contracts, disputes, commissions, fund] = await Promise.all([
    pool.query('SELECT COUNT(*)::int count FROM users'),
    pool.query("SELECT status,COUNT(*)::int count FROM listings GROUP BY status"),
    pool.query("SELECT status,COUNT(*)::int count FROM contracts GROUP BY status"),
    pool.query("SELECT status,COUNT(*)::int count FROM disputes GROUP BY status"),
    pool.query("SELECT COALESCE(SUM(amount),0)::bigint total FROM ledger_entries WHERE entry_type='platform_commission'"),
    pool.query("SELECT COALESCE(SUM(CASE WHEN entry_type='fine_in' THEN amount WHEN entry_type='bonus_out' THEN -amount ELSE 0 END),0)::bigint total FROM bonus_fund_entries")
  ]);
  res.json({ users: users.rows[0].count, listings: listings.rows, contracts: contracts.rows, disputes: disputes.rows,
    totalCommissionCoins: Number(commissions.rows[0].total), bonusFundCoins: Number(fund.rows[0].total), moneyNote: 'Son métricas internas en Coins, no pesos mexicanos ni utilidad neta.' });
}));

app.get('/api/admin/listings', authRequired, staffRequired, asyncRoute(async (req, res) => {
  const status = LISTING_STATUSES.includes(String(req.query.status || 'pending')) ? String(req.query.status || 'pending') : 'pending';
  const { rows } = await pool.query('SELECT l.*,u.name seller_name,u.phone seller_phone FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.status=$1 ORDER BY l.created_at ASC LIMIT 200', [status]);
  res.json({ listings: rows });
}));

app.post('/api/admin/listings/:id/review', authRequired, staffRequired, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id);
  const action = String(req.body.action || '');
  const reason = cleanText(req.body.reason, 1000);
  const statusMap = { approve: 'approved', reject: 'rejected', changes: 'needs_changes' };
  if (!statusMap[action] || (action !== 'approve' && reason.length < 5)) return res.status(400).json({ error: 'Acción o motivo de revisión inválido.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM listings WHERE id=$1 FOR UPDATE', [id]);
    const listing = rows[0];
    if (!listing || listing.status !== 'pending') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'La publicación ya fue revisada o no existe.' }); }
    await client.query('UPDATE listings SET status=$2,moderation_reason=$3,moderated_by=$4,moderated_at=NOW(),updated_at=NOW() WHERE id=$1',
      [id, statusMap[action], reason || 'Aprobada tras revisión manual.', req.auth.id]);
    await client.query('INSERT INTO moderation_actions(actor_user_id,target_type,target_id,action,reason) VALUES($1,\'listing\',$2,$3,$4)',
      [req.auth.id, id, action, reason || 'Aprobada tras revisión manual.']);
    await client.query('COMMIT');
    res.json({ ok: true, status: statusMap[action] });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

app.get('/api/admin/disputes', authRequired, staffRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT d.*,c.buyer_id,c.seller_id,c.price_coins,c.status contract_status,l.title listing_title,
     opener.name opened_by_name FROM disputes d JOIN contracts c ON c.id=d.contract_id
     JOIN listings l ON l.id=c.listing_id JOIN users opener ON opener.id=d.opened_by
     WHERE d.status IN ('open','under_review','appealed') ORDER BY d.created_at ASC LIMIT 200`);
  res.json({ disputes: rows });
}));

app.post('/api/admin/disputes/:id/decision', authRequired, staffRequired, asyncRoute(async (req, res) => {
  const id = positiveInt(req.params.id);
  const decision = cleanText(req.body.decision, 1500);
  const outcome = String(req.body.outcome || '');
  if (!['uphold_buyer','uphold_seller','refund_full','other'].includes(outcome) || decision.length < 10) return res.status(400).json({ error: 'Selecciona un resultado y explica la decisión.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT d.*,c.buyer_id,c.seller_id,c.price_coins,c.provider_coins,c.commission_coins,c.status contract_status
       FROM disputes d JOIN contracts c ON c.id=d.contract_id WHERE d.id=$1 FOR UPDATE OF d,c`, [id]);
    const d = rows[0];
    if (!d || !['open','under_review','appealed'].includes(d.status)) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Disputa no disponible.' }); }
    if (Number(d.opened_by) === req.auth.id || Number(d.buyer_id) === req.auth.id || Number(d.seller_id) === req.auth.id) {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Para evitar conflicto de interés, no puedes resolver una disputa en la que estés implicado.' });
    }
    // This MVP supports a full buyer refund or release to seller. Other outcome is deliberately not automatic.
    if (outcome === 'other') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Este resultado requiere resolución manual fuera del sistema; no se movió saldo.' }); }
    if (outcome === 'uphold_seller') {
      await client.query('UPDATE wallets SET earned_coins=earned_coins+$2,updated_at=NOW() WHERE user_id=$1', [d.seller_id, d.provider_coins]);
      await addLedger(client, { userId: d.seller_id, actorId: req.auth.id, type: 'contract_payout', bucket: 'earned', amount: Number(d.provider_coins), reference: `contract:${d.contract_id}`, reason: 'Pago liberado tras resolución de disputa.', key: `contract:${d.contract_id}:payout` });
      await addLedger(client, { userId: null, actorId: req.auth.id, type: 'platform_commission', bucket: 'platform', amount: Number(d.commission_coins), reference: `contract:${d.contract_id}`, reason: 'Comisión reconocida tras resolución de disputa.', key: `contract:${d.contract_id}:commission` });
      await client.query("UPDATE contracts SET status='completed',released_at=NOW(),updated_at=NOW() WHERE id=$1", [d.contract_id]);
    } else {
      // Restore the original paid amount to the buyer as purchased/earned split cannot be reconstructed in this MVP.
      // To avoid inventing a balance classification, full refunds are recorded as purchased Coins and audited.
      await client.query('UPDATE wallets SET purchased_coins=purchased_coins+$2,updated_at=NOW() WHERE user_id=$1', [d.buyer_id, d.price_coins]);
      await addLedger(client, { userId: d.buyer_id, actorId: req.auth.id, type: 'contract_refund', bucket: 'purchased', amount: Number(d.price_coins), reference: `contract:${d.contract_id}`, reason: 'Reembolso completo por resolución de disputa.', key: `contract:${d.contract_id}:refund` });
      await client.query("UPDATE contracts SET status='refunded',updated_at=NOW() WHERE id=$1", [d.contract_id]);
    }
    await client.query("UPDATE disputes SET status='resolved',decision=$2,decided_by=$3,decided_at=NOW() WHERE id=$1", [id, `${outcome}: ${decision}`, req.auth.id]);
    await client.query('INSERT INTO moderation_actions(actor_user_id,target_type,target_id,action,reason) VALUES($1,\'dispute\',$2,$3,$4)', [req.auth.id, id, outcome, decision]);
    await client.query('COMMIT');
    res.json({ ok: true, message: 'Resolución registrada y auditada.' });
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}));

app.post('/api/admin/wallet/credit', authRequired, ownerRequired, asyncRoute(async (req, res) => {
  const userId = positiveInt(req.body.userId);
  const amount = positiveInt(req.body.amount, 1000000000);
  const reference = cleanText(req.body.reference, 120);
  const reason = cleanText(req.body.reason, 500);
  const idempotencyKey = cleanText(req.body.idempotencyKey, 160);
  if (!userId || !amount || !reference || reason.length < 5 || idempotencyKey.length < 8) return res.status(400).json({ error: 'Incluye usuario, cantidad, referencia, motivo y clave única de operación.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: existing } = await client.query('SELECT id FROM ledger_entries WHERE idempotency_key=$1', [idempotencyKey]);
    if (existing.length) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Esta operación ya fue registrada; no se duplicó el crédito.' }); }
    const { rows: users } = await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
    if (!users.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Usuario no encontrado.' }); }
    await client.query('UPDATE wallets SET purchased_coins=purchased_coins+$2,updated_at=NOW() WHERE user_id=$1', [userId, amount]);
    await addLedger(client, { userId, actorId: req.auth.id, type: 'manual_deposit_credit', bucket: 'purchased', amount, reference, reason, key: idempotencyKey });
    await client.query('COMMIT');
    res.json({ ok: true, message: 'Crédito manual registrado. Asegúrate de haber verificado el pago real antes de usar esta función.' });
  } catch (e) { await client.query('ROLLBACK'); if (e.code === '23505') return res.status(409).json({ error: 'La clave de operación ya existe.' }); throw e; }
  finally { client.release(); }
}));

app.post('/api/admin/bonus-fund', authRequired, ownerRequired, asyncRoute(async (req, res) => {
  const type = String(req.body.type || '');
  const amount = positiveInt(req.body.amount);
  const recipientId = req.body.recipientId ? positiveInt(req.body.recipientId) : null;
  const reason = cleanText(req.body.reason, 500);
  const reference = cleanText(req.body.reference, 120);
  if (!['fine_in','bonus_out'].includes(type) || !amount || reason.length < 5 || (type === 'bonus_out' && !recipientId)) return res.status(400).json({ error: 'Datos inválidos para el fondo de bonificaciones.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: sums } = await client.query("SELECT COALESCE(SUM(CASE WHEN entry_type='fine_in' THEN amount WHEN entry_type='bonus_out' THEN -amount ELSE 0 END),0)::bigint total FROM bonus_fund_entries");
    const balance = Number(sums[0].total);
    if (type === 'bonus_out' && balance < amount) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'El fondo no tiene suficientes Coins.' }); }
    if (type === 'bonus_out') {
      await client.query('UPDATE wallets SET earned_coins=earned_coins+$2,updated_at=NOW() WHERE user_id=$1', [recipientId, amount]);
      await addLedger(client, { userId: recipientId, actorId: req.auth.id, type: 'monthly_bonus', bucket: 'earned', amount, reference: reference || null, reason, key: reference ? `bonus:${reference}` : null });
    }
    await client.query('INSERT INTO bonus_fund_entries(actor_user_id,entry_type,amount,recipient_user_id,reference,reason) VALUES($1,$2,$3,$4,$5,$6)',
      [req.auth.id, type, amount, recipientId, reference || null, reason]);
    await client.query('COMMIT');
    res.json({ ok: true, message: type === 'fine_in' ? 'Entrada al fondo registrada.' : 'Bonificación registrada.' });
  } catch (e) { await client.query('ROLLBACK'); if (e.code === '23505') return res.status(409).json({ error: 'Referencia duplicada.' }); throw e; }
  finally { client.release(); }
}));

app.get('/api/admin/ledger', authRequired, staffRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT le.*,u.name user_name,u.phone user_phone,a.name actor_name
     FROM ledger_entries le LEFT JOIN users u ON u.id=le.user_id LEFT JOIN users a ON a.id=le.actor_user_id
     ORDER BY le.created_at DESC LIMIT 250`);
  res.json({ entries: rows });
}));

app.use('/api', apiLimiter);
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ error: 'El registro ya existe.' });
  res.status(500).json({ error: 'Ocurrió un error interno. Inténtalo de nuevo más tarde.' });
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Gamer Marketplace listening on ${PORT}; demo=${DEMO_MODE}; realMoney=false`));
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

module.exports = { app, normalizePhone, positiveInt };
