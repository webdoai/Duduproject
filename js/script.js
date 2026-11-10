/* DUDU FOOD - site behaviour. All business data lives in js/config.js. */
(() => {
'use strict';

const C = window.DUDU_CONFIG || {};
const MENU = Array.isArray(C.menu) ? C.menu : [];
const GALLERY = Array.isArray(C.gallery) ? C.gallery : [];
const SHOWCASE = Array.isArray(C.showcase) ? C.showcase : [];
const CUR = C.currency || '\u20B9';
const BRAND = 'DUDU FOOD';
const CART_KEY = 'dudu-food-cart-v1';
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hasPrice = p => typeof p === 'number' && isFinite(p) && p >= 0;
const money = p => hasPrice(p) ? CUR + p.toLocaleString('en-IN') : 'Price TBA';
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const waNumber = () => String(C.whatsappNumber || '').replace(/\D/g, '');
const waReady = () => waNumber().length >= 10;
const byId = id => MENU.find(m => m.id === id);

/* ---------- Illustrated placeholders (used until real photos are added) ---------- */
const PALETTES = {
  rice: { base: '#F6BE35', bits: ['#FFF3DF', '#FFA500', '#6B8E23', '#E8A317'] },
  chickenRice: { base: '#EDB22E', bits: ['#FFF3DF', '#8B5A2B', '#6B8E23', '#FFA500'] },
  gobi: { base: '#E8710A', bits: ['#FFA500', '#B5470A', '#F6BE35', '#6B8E23'] },
  chickenGobi: { base: '#D9560B', bits: ['#8B3A0E', '#FFA500', '#F6BE35', '#6B8E23'] },
  manchurian: { base: '#5A2A14', bits: ['#8B3A0E', '#3A1A0C', '#6B8E23', '#FFA500'] }
};
function art(kind = 'rice', seed = 1) {
  const p = PALETTES[kind] || PALETTES.rice;
  let s = seed * 9301 + 49297;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let bits = '';
  for (let i = 0; i < 34; i++) {
    const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 52;
    bits += `<circle cx="${(100 + Math.cos(a) * d).toFixed(1)}" cy="${(100 + Math.sin(a) * d).toFixed(1)}" r="${(3 + rnd() * 6).toFixed(1)}" fill="${p.bits[i % p.bits.length]}"/>`;
  }
  return `<svg class="art" viewBox="0 0 200 200" role="img" aria-label="Illustration of the dish"><circle cx="100" cy="106" r="86" fill="#000" opacity=".25"/><circle cx="100" cy="100" r="86" fill="#2a2a2a"/><circle cx="100" cy="100" r="76" fill="#FFF3DF"/><circle cx="100" cy="100" r="64" fill="${p.base}"/>${bits}</svg>`;
}
/* Photo if configured, otherwise the illustration. A broken photo falls back too. */
function media(src, alt, kind, idx, { w = 640, h = 480, eager = false } = {}) {
  if (src) {
    return `<img src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-art="${esc(kind || 'rice')}" data-seed="${idx + 1}">`;
  }
  return art(kind, idx + 1);
}
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.dataset.art) t.outerHTML = art(t.dataset.art, +t.dataset.seed || 1);
}, true);

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- Menu ---------- */
let filter = 'all', query = '';
const grid = $('#menu-grid');

function cardHTML(m) {
  const idx = MENU.indexOf(m);
  const label = m.category === 'nonveg' ? 'Non-vegetarian' : 'Vegetarian';
  return `<article class="card reveal">
    <div class="media">${media(m.image, m.name, m.art, idx)}</div>
    <div class="c-body">
      <div class="c-top"><span class="diet ${m.category === 'nonveg' ? 'nonveg' : 'veg'}" role="img" aria-label="${label}"></span><h3>${esc(m.name)}</h3></div>
      <p>${esc(m.description)}</p>
      <div class="c-foot">
        <span class="price ${hasPrice(m.price) ? '' : 'tba'}">${money(m.price)}</span>
        <button class="btn btn-primary btn-sm" type="button" data-add="${esc(m.id)}" aria-label="Add ${esc(m.name)} to order">Add to Order</button>
      </div>
    </div></article>`;
}
function renderMenu() {
  const q = query.trim().toLowerCase();
  const list = MENU.filter(m => (filter === 'all' || m.category === filter) &&
    (!q || `${m.name} ${m.description || ''}`.toLowerCase().includes(q)));
  grid.innerHTML = list.map(cardHTML).join('');
  $('#menu-empty').hidden = list.length > 0 || MENU.length === 0;
  if (!MENU.length) grid.innerHTML = '<p class="empty">The menu is being updated. Please check back soon.</p>';
  observeReveal(grid);
}
function setFilter(f) {
  filter = f;
  $$('.filter').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
  renderMenu();
}
$$('.filter').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
$('#menu-search').addEventListener('input', e => { query = e.target.value; renderMenu(); });
$$('[data-jump]').forEach(a => a.addEventListener('click', () => setFilter(a.dataset.jump)));

/* ---------- Cart (id -> quantity), saved in this browser only ---------- */
let cart = {};
try {
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  Object.keys(saved).forEach(id => {
    const q = Number(saved[id]);
    if (byId(id) && Number.isInteger(q) && q > 0) cart[id] = Math.min(q, 50);
  });
} catch (_) { cart = {}; }
const persist = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) { /* storage unavailable */ } };
const cartItems = () => Object.keys(cart).map(id => ({ item: byId(id), qty: cart[id] })).filter(l => l.item);
const cartCount = () => cartItems().reduce((n, l) => n + l.qty, 0);

function addToCart(id) {
  if (!byId(id)) return;
  cart[id] = Math.min((cart[id] || 0) + 1, 50);
  persist(); renderCart();
  const badge = $('#cart-count');
  badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
  toast(`${byId(id).name} added to your order`);
}
function renderCart() {
  const lines = cartItems();
  const count = cartCount();
  const badge = $('#cart-count');
  badge.textContent = count; badge.hidden = count === 0;
  $('#open-cart').setAttribute('aria-label', count ? `Open your order, ${count} item${count > 1 ? 's' : ''}` : 'Open your order');
  $('#cart-empty').hidden = lines.length > 0;
  $('#cart-foot').hidden = lines.length === 0;
  $('#cart-lines').innerHTML = lines.map(({ item, qty }) => `<li class="line">
    <div><strong>${esc(item.name)}</strong><div class="unit">${money(item.price)} each</div></div>
    <div class="lt">${hasPrice(item.price) ? CUR + (item.price * qty).toLocaleString('en-IN') : 'TBA'}</div>
    <div class="qty"><button type="button" data-dec="${esc(item.id)}" aria-label="Decrease ${esc(item.name)}">&minus;</button><span aria-live="polite">${qty}</span><button type="button" data-inc="${esc(item.id)}" aria-label="Increase ${esc(item.name)}">+</button></div>
    <button class="rm" type="button" data-rm="${esc(item.id)}" aria-label="Remove ${esc(item.name)}">Remove</button></li>`).join('');
  const priced = lines.filter(l => hasPrice(l.item.price));
  const total = priced.reduce((s, l) => s + l.item.price * l.qty, 0);
  const anyTba = priced.length < lines.length;
  const totalText = priced.length ? CUR + total.toLocaleString('en-IN') + (anyTba ? ' + TBA' : '') : 'TBA';
  $('#subtotal').textContent = totalText;
  $('#total').textContent = totalText;
  $('#tba-note').hidden = !anyTba;
  if (!lines.length) showCartView();
}
grid.addEventListener('click', e => {
  const b = e.target.closest('[data-add]');
  if (b) addToCart(b.dataset.add);
});
$('#cart-lines').addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const id = t.dataset.inc || t.dataset.dec || t.dataset.rm;
  if (!id || !(id in cart)) return;
  if (t.dataset.inc) cart[id] = Math.min(cart[id] + 1, 50);
  else if (t.dataset.dec) { cart[id] -= 1; if (cart[id] < 1) delete cart[id]; }
  else delete cart[id];
  persist(); renderCart();
});
$('#clear-cart').addEventListener('click', () => { cart = {}; persist(); renderCart(); });

/* ---------- Cart drawer ---------- */
const drawer = $('#cart'), overlay = $('#overlay');
let lastFocus = null;
function openCart() {
  lastFocus = document.activeElement;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('show'));
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  closeNav();
  setTimeout(() => $('#close-cart').focus(), 50);
}
function closeCart() {
  overlay.classList.remove('show');
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  setTimeout(() => { overlay.hidden = true; }, 300);
  showCartView();
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
const isOpen = () => drawer.classList.contains('open');
function showCartView() {
  $('#cart-view').hidden = false; $('#checkout-view').hidden = true;
  $('#cart-foot').hidden = cartItems().length === 0;
}
function showCheckout() {
  $('#cart-view').hidden = true; $('#checkout-view').hidden = false; $('#cart-foot').hidden = true;
  $$('.err').forEach(e => { e.textContent = ''; e.classList.remove('ok'); });
  $('#c-name').focus();
}
$('#open-cart').addEventListener('click', openCart);
$('#close-cart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
$('#continue').addEventListener('click', () => { closeCart(); location.hash = '#menu'; });
$('#proceed').addEventListener('click', showCheckout);
$('#back-cart').addEventListener('click', () => { showCartView(); renderCart(); });
/* ORDER NOW: open the cart if it has items, otherwise take the customer to the menu */
$$('[data-order]').forEach(b => b.addEventListener('click', () => {
  closeNav();
  if (cartCount()) openCart(); else { $('#menu').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); toast('Pick your dishes and tap Add to Order'); }
}));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (isOpen()) closeCart(); closeNav(); }
  if (e.key === 'Tab' && isOpen()) { /* keep focus inside the drawer */
    const f = $$('button:not([hidden]),input,a[href]', drawer).filter(el => !el.closest('[hidden]') && !el.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Checkout: validate, then open WhatsApp with the order text ---------- */
function buildMessage(name, phone, note) {
  const lines = cartItems();
  let total = 0, anyTba = false;
  const rows = lines.map(({ item, qty }, i) => {
    if (hasPrice(item.price)) { total += item.price * qty; return `${i + 1}. ${item.name} x ${qty} - ${CUR}${(item.price * qty).toLocaleString('en-IN')} (${CUR}${item.price.toLocaleString('en-IN')} each)`; }
    anyTba = true; return `${i + 1}. ${item.name} x ${qty} - price to be confirmed`;
  });
  return [`*New order - ${BRAND}*`, '', `Name: ${name}`, `Phone: ${phone}`, '', ...rows, '',
    `*Total: ${CUR}${total.toLocaleString('en-IN')}${anyTba ? ' + items to be priced' : ''}*`,
    note ? `Note: ${note}` : '', '', '_This order is not confirmed until the restaurant confirms it._'].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}
$('#checkout-view').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#c-name').value.trim().replace(/\s+/g, ' ');
  const rawPhone = $('#c-phone').value.trim();
  const digits = rawPhone.replace(/[\s\-()]/g, '');
  const note = $('#c-note').value.trim().replace(/\s+/g, ' ');
  const eName = $('#e-name'), ePhone = $('#e-phone'), eForm = $('#e-form');
  eName.textContent = ePhone.textContent = eForm.textContent = '';
  eForm.classList.remove('ok');
  let valid = true;
  if (name.length < 2) { eName.textContent = 'Enter your name (at least 2 letters).'; valid = false; }
  if (!/^(\+?91)?[6-9]\d{9}$/.test(digits)) { ePhone.textContent = 'Enter a valid 10-digit Indian mobile number.'; valid = false; }
  if (!valid) return;
  if (!cartItems().length) { eForm.textContent = 'Your order is empty. Add a dish first.'; return; }
  if (!waReady()) { eForm.textContent = 'Online ordering is not set up yet. Please contact the restaurant directly.'; return; }
  const url = `https://wa.me/${waNumber()}?text=${encodeURIComponent(buildMessage(name, rawPhone, note))}`;
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); a.remove();
  eForm.classList.add('ok');
  eForm.textContent = 'WhatsApp is opening with your order. Send the message to place it. Your order is not confirmed until DUDU FOOD confirms it.';
});

/* ---------- Hero, showcase, gallery ---------- */
function renderHero() {
  const main = C.heroImage ? media(C.heroImage, 'DUDU FOOD signature dish', 'rice', 0, { w: 640, h: 640, eager: true }) : art('rice', 3);
  $('#hero-visual').innerHTML = `<div class="plate main">${main}</div><div class="plate s1">${art('gobi', 5)}</div><div class="plate s2">${art('manchurian', 7)}</div>`;
}
function renderShowcase() {
  $('#showcase-grid').innerHTML = SHOWCASE.map((s, i) => {
    const m = byId(s.menuId) || {};
    return `<article class="sc-item reveal"><div class="media">${media(m.image, s.title, m.art, i, { w: 600, h: 750 })}</div>
      <div class="sc-cap"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><a href="#menu">See the menu</a></div></article>`;
  }).join('');
}
function renderGallery() {
  $('#gallery-grid').innerHTML = GALLERY.map((g, i) => `<button class="g-item reveal" type="button" data-gi="${i}" aria-label="View larger: ${esc(g.alt)}">
    <div class="media">${media(g.src, g.alt, g.art, i, { w: 600, h: 600 })}</div><span class="g-cap">${esc(g.alt)}</span></button>`).join('');
}
const lb = $('#lightbox');
$('#gallery-grid').addEventListener('click', e => {
  const b = e.target.closest('[data-gi]');
  if (!b) return;
  const g = GALLERY[+b.dataset.gi];
  $('#lb-fig').innerHTML = `${media(g.src, g.alt, g.art, +b.dataset.gi, { w: 1200, h: 900 })}<figcaption>${esc(g.alt)}</figcaption>`;
  if (typeof lb.showModal === 'function') lb.showModal();
});
$('#lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

/* ---------- Contact details (only shows what is configured) ---------- */
function renderContact() {
  const phoneDigits = String(C.phoneDisplay || '').replace(/[^\d+]/g, '');
  const phoneHTML = C.phoneDisplay && phoneDigits.length >= 8
    ? `<a href="tel:${esc(phoneDigits)}">${esc(C.phoneDisplay)}</a>` : '<span class="placeholder">Phone number coming soon</span>';
  const hours = Array.isArray(C.hours) ? C.hours.filter(h => h && h.days && h.time) : [];
  const hoursHTML = hours.length
    ? `<ul>${hours.map(h => `<li><strong>${esc(h.days)}</strong>: ${esc(h.time)}</li>`).join('')}</ul>` : '<span class="placeholder">Opening hours coming soon</span>';
  const social = Object.entries(C.social || {}).map(([k, v]) => [k, safeUrl(v)]).filter(([, v]) => v);
  const socialHTML = social.length
    ? `<div class="social">${social.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">${esc(k.charAt(0).toUpperCase() + k.slice(1))}</a>`).join('')}</div>` : '<span class="placeholder">Social links coming soon</span>';
  $$('[data-fill="phone"]').forEach(el => { el.innerHTML = phoneHTML; });
  $$('[data-fill="hours"]').forEach(el => { el.innerHTML = hoursHTML; });
  $$('[data-fill="social"]').forEach(el => { el.innerHTML = socialHTML; });
  $('#directions').href = safeUrl(C.mapsUrl) || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('DUDU FOOD, Ramnagar Colony, Chittoor');
  $('#wa-contact').addEventListener('click', () => {
    if (!waReady()) { toast('WhatsApp ordering is not set up yet. Please use the menu or check back soon.'); return; }
    window.open(`https://wa.me/${waNumber()}?text=${encodeURIComponent('Hi DUDU FOOD, I would like to place an order.')}`, '_blank', 'noopener');
  });
  $('#year').textContent = new Date().getFullYear();
}

/* ---------- Navigation: mobile menu, sticky shadow, active link ---------- */
const nav = $('#primary-nav'), burger = $('#burger');
function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); }
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
$$('a', nav).forEach(a => a.addEventListener('click', closeNav));
const header = $('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
if ('IntersectionObserver' in window) {
  const links = $$('a[href^="#"]', nav);
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.setAttribute('aria-current', String(l.getAttribute('href') === '#' + en.target.id)));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'menu', 'why', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) spy.observe(s); });
}

/* ---------- Scroll reveal ---------- */
let revealObs = null;
if ('IntersectionObserver' in window && !REDUCED) {
  revealObs = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); } }), { threshold: .12 });
}
function observeReveal(root = document) {
  $$('.reveal:not(.in)', root).forEach(el => revealObs ? revealObs.observe(el) : el.classList.add('in'));
}

/* ---------- Init ---------- */
renderHero(); renderMenu(); renderShowcase(); renderGallery(); renderContact(); renderCart();
observeReveal();
})();
