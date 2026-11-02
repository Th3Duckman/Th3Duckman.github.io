import { email, validateInterval, matchingCommands, terminalResponse } from './logic.js';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedMotion.matches;
let toastTimeout;

function toast(message) {
  const element = $('.toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('visible'), 3200);
}

async function copyEmail() {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(email);
    toast('Email address copied. Say hello!');
  } catch {
    toast('Copy is unavailable here. The email address is shown in Contact.');
    $('#contact').scrollIntoView({ behavior: motionPaused ? 'instant' : 'smooth' });
  }
}
$('.copy-email').addEventListener('click', copyEmail);
$('#year').textContent = new Date().getFullYear();
const clockFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function updateClock() { $('#local-clock').textContent = clockFormat.format(new Date()); }
updateClock();
setInterval(updateClock, 1000);

// A native dialog keeps keyboard focus inside the menu and restores it on close.
const commandDialog = $('#command-dialog');
const detailDialog = $('#detail-dialog');
let restoreFocus;
let detailCleanup = () => {};
function closeDialog(dialog) { if (dialog.open) dialog.close(); }
for (const dialog of [commandDialog, detailDialog]) {
  $$('.dialog-close', dialog).forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = $$('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])', dialog)
      .filter(element => element.getClientRects().length > 0 && !element.closest('[hidden], [inert]'));
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  });
}
detailDialog.addEventListener('close', () => { detailCleanup(); detailCleanup = () => {}; restoreFocus?.focus({ preventScroll: true }); });

const commands = [
  { label: 'Explore my work', icon: '01', keywords: 'projects guardian java', action: () => navigate('#work'), type: 'SECTION' },
  { label: 'About Achilleas', icon: '02', keywords: 'bio backend csharp developer', action: () => navigate('#about'), type: 'SECTION' },
  { label: 'Experience & education', icon: '03', keywords: 'dbsoft alfa cv history', action: () => navigate('#experience'), type: 'SECTION' },
  { label: 'Get in touch', icon: '04', keywords: 'contact email hire', action: () => navigate('#contact'), type: 'SECTION' },
  { label: 'Try Guardian', icon: '>_', keywords: 'break reminder demo c# dotnet', action: () => openDetail('guardian'), type: 'PROJECT' },
  { label: 'Open terminal', icon: '>_', keywords: 'console commands easter egg', action: () => openDetail('terminal'), type: 'INTERACTIVE' },
  { label: 'Copy email address', icon: '@', keywords: 'contact clipboard', action: copyEmail, type: 'ACTION' },
  { label: 'Download CV', icon: '↓︎', keywords: 'resume pdf', action: () => $('#home a[download]').click(), type: 'PDF' },
  { label: 'Toggle animations', icon: 'Ⅱ', keywords: 'pause resume motion accessibility', action: () => { setMotion(!motionPaused); toast(motionPaused ? 'Animations paused.' : 'Animations resumed.'); }, type: 'DISPLAY' },
  { label: 'Back to top', icon: '↑︎', keywords: 'home start', action: () => navigate('#home'), type: 'SECTION' },
];
let filteredCommands = commands;
let selectedCommand = 0;
function navigate(target) {
  $(target).scrollIntoView({ behavior: motionPaused ? 'instant' : 'smooth' });
  history.replaceState(null, '', target);
}
function renderCommands() {
  filteredCommands = matchingCommands(commands, $('#command-input').value);
  selectedCommand = 0;
  const fragment = document.createDocumentFragment();
  filteredCommands.forEach((command, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'command-item';
    const icon = document.createElement('span'); icon.className = 'command-icon'; icon.textContent = command.icon;
    const label = document.createElement('span'); label.textContent = command.label;
    const type = document.createElement('span'); type.textContent = command.type;
    button.append(icon, label, type);
    button.addEventListener('pointermove', () => setCommand(index));
    button.addEventListener('focus', () => setCommand(index));
    button.addEventListener('click', () => executeCommand(index));
    fragment.append(button);
  });
  $('#command-results').replaceChildren(fragment);
  $('#command-empty').hidden = filteredCommands.length > 0;
  setCommand(0);
}
function setCommand(index) {
  selectedCommand = index;
  $$('.command-item').forEach((button, i) => { button.toggleAttribute('data-active', i === index); });
}
function executeCommand(index) {
  const command = filteredCommands[index];
  if (!command) return;
  closeDialog(commandDialog);
  command.action();
}
function openCommands() {
  if (detailDialog.open) return;
  closeMobileNav();
  if (commandDialog.open) { closeDialog(commandDialog); return; }
  $('#command-input').value = '';
  renderCommands();
  commandDialog.showModal();
  $('#command-input').focus();
}
$('.command-trigger').addEventListener('click', openCommands);
$('#command-input').addEventListener('input', renderCommands);
commandDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!filteredCommands.length) return;
    setCommand((selectedCommand + (event.key === 'ArrowDown' ? 1 : -1) + filteredCommands.length) % filteredCommands.length);
    $$('.command-item')[selectedCommand]?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Enter' && event.target === $('#command-input')) {
    event.preventDefault(); executeCommand(selectedCommand);
  }
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommands(); }
});
if (/Mac|iPhone|iPad/.test(navigator.platform)) $('.command-trigger kbd').textContent = '⌘ K';

const menuToggle = $('.mobile-menu-toggle');
function closeMobileNav() { menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation'); $('#mobile-nav').hidden = true; }
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  $('#mobile-nav').hidden = !open;
});
$$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMobileNav));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobileNav(); });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMobileNav(); });

function openDetail(project) {
  closeDialog(commandDialog);
  detailCleanup();
  detailCleanup = () => {};
  if (!detailDialog.open) restoreFocus = document.activeElement;
  $('#detail-title').textContent = project === 'guardian' ? 'Guardian.' : 'Behind the interface.';
  $('#detail-kicker').textContent = project === 'guardian' ? 'C# / .NET · LINUX · PROJECT 001' : 'INTERACTIVE TERMINAL · TYPE HELP TO START';
  if (project === 'guardian') {
    $('#detail-content').innerHTML = `<div class="detail-body"><p>A small console application with a practical purpose: remind you to take a break. Built in C#/.NET on Fedora Linux.</p><h3>The thinking behind it</h3><ul class="feature-list"><li>Validate positive intervals with int.TryParse before starting a session.</li><li>Call the Linux notification program with System.Diagnostics.Process.</li><li>Save completed rounds to a text file, then load them on the next run.</li><li>Offer an optional reset and varied reminder messages.</li></ul><p class="detail-note">BROWSER WALKTHROUGH / This is an accelerated simulation of the flow, not the original C# runtime. Each demo round takes 5 seconds. It won't send desktop notifications.</p><div class="guardian-simulator"><form id="guardian-form"><label for="guardian-interval">Break interval in minutes</label><div class="demo-field"><input type="text" id="guardian-interval" inputmode="numeric" value="25" autocomplete="off" aria-describedby="guardian-output"><button type="submit">Run preview <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></button></div></form><div id="guardian-output" class="demo-output" role="status" aria-live="polite">Ready. Enter an interval to test the flow.</div><div class="demo-footer"><span>COMPLETED DEMO ROUNDS: <span id="demo-rounds">0</span></span><button type="button" id="reset-demo">Reset demo</button></div></div><a class="text-button" href="https://github.com/Th3Duckman/AFK-Guardian" target="_blank" rel="noopener noreferrer">Explore the original source <span aria-hidden="true"><svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></span></a></div>`;
    setupGuardian();
  } else {
    $('#detail-content').innerHTML = `<div class="detail-body"><p>Another way to look around. Type a command below and press Enter. Everything runs locally in your browser.</p><div class="terminal-interactive"><div class="terminal-output" id="terminal-output" role="log" aria-live="polite" aria-label="Terminal output"><p>ACHILLEAS.DEV / PORTFOLIO SHELL v1.0<br>Welcome. Type help to see the available commands.</p></div><form id="terminal-form" class="terminal-input-row"><label for="terminal-input" aria-label="Command">visitor ~$</label><input id="terminal-input" type="text" placeholder="help" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="200"></form></div><p class="terminal-help">NO INSTALLS. NO REAL SHELL. JUST A DIFFERENT WAY TO EXPLORE.</p></div>`;
    setupTerminal();
  }
  if (!detailDialog.open) detailDialog.showModal();
  requestAnimationFrame(() => $(project === 'guardian' ? '#guardian-interval' : '#terminal-input')?.focus());
}
$$('[data-open]').forEach(button => button.addEventListener('click', () => openDetail(button.dataset.open)));

function setupGuardian() {
  let rounds = 0;
  let timer;
  try { rounds = Math.max(0, Number.parseInt(localStorage.getItem('guardian-demo-rounds'), 10) || 0); } catch { /* Storage is optional. */ }
  $('#demo-rounds').textContent = rounds;
  const output = $('#guardian-output');
  const submit = $('#guardian-form button');
  const field = $('#guardian-interval');
  const save = () => { try { localStorage.setItem('guardian-demo-rounds', String(rounds)); } catch { /* The demo still runs in private sessions. */ } };
  $('#guardian-form').addEventListener('submit', event => {
    event.preventDefault();
    const result = validateInterval(field.value);
    field.setAttribute('aria-invalid', String(!result.valid));
    output.classList.toggle('simulator-error', !result.valid);
    if (!result.valid) { output.textContent = `! ${result.message}`; return; }
    submit.disabled = true; field.disabled = true;
    output.textContent = `✓ ${result.minutes} minute interval validated.\n✓ Previous demo progress loaded.\n→ Running a 5-second preview…`;
    timer = setTimeout(() => {
      rounds += 1; save();
      $('#demo-rounds').textContent = rounds;
      output.textContent = `✓ Round complete. Time to take a break.\n✓ Demo progress saved in this browser.\n→ The original application would show a desktop reminder after ${result.minutes} minutes.`;
      submit.disabled = false; field.disabled = false;
    }, 5000);
  });
  $('#reset-demo').addEventListener('click', () => {
    clearTimeout(timer); rounds = 0; save();
    $('#demo-rounds').textContent = '0'; submit.disabled = false; field.disabled = false;
    field.removeAttribute('aria-invalid'); output.classList.remove('simulator-error');
    output.textContent = 'Demo progress reset. Ready for a fresh start.';
  });
  detailCleanup = () => clearTimeout(timer);
}

function setupTerminal() {
  const input = $('#terminal-input');
  const output = $('#terminal-output');
  const commandHistory = [];
  let historyIndex = 0;
  $('#terminal-form').addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    commandHistory.push(value); historyIndex = commandHistory.length;
    input.value = '';
    const command = value.toLowerCase();
    if (command === 'clear') { output.replaceChildren(); return; }
    if (command === 'exit') { closeDialog(detailDialog); return; }
    if (command === 'guardian') { openDetail('guardian'); return; }
    const line = document.createElement('p');
    const prompt = document.createElement('span'); prompt.className = 'red'; prompt.textContent = `visitor ~$ ${value}\n`;
    line.append(prompt, document.createTextNode(terminalResponse(value)));
    output.append(line);
    while (output.children.length > 30) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  });
  input.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    input.value = commandHistory[historyIndex] || '';
  });
}

// Decorative rendering stays local, uses no WebGL dependencies, and stops offscreen.
const canvas = $('#core-canvas');
const context = canvas.getContext('2d');
const pointCount = 570;
const spherePoints = Array.from({ length: pointCount }, (_, i) => {
  const y = 1 - (i / (pointCount - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = Math.PI * (3 - Math.sqrt(5)) * i;
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
});
const cubePoints = Array.from({ length: pointCount }, (_, i) => {
  const face = i % 6;
  const index = Math.floor(i / 6);
  const a = ((index % 10) / 9) * 2 - 1;
  const b = (Math.floor(index / 10) / 9) * 2 - 1;
  return [[1, a, b], [-1, a, b], [a, 1, b], [a, -1, b], [a, b, 1], [a, b, -1]][face].map(n => n * .76);
});
let shape = 'sphere';
let morph = 0;
let rotationX = -.16;
let rotationY = .3;
let width = 0, height = 0;
let frame;
let inView = true;
let dragging = false;
let dragX = 0, dragY = 0;
let lastFrame = 0;
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawCore();
}
function drawCore() {
  if (!context || !width || !height) return;
  context.clearRect(0, 0, width, height);
  const scale = Math.min(width * .31, height * .43);
  const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
  const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
  const points = spherePoints.map((s, i) => {
    const c = cubePoints[i];
    const x = s[0] + (c[0] - s[0]) * morph;
    const y = s[1] + (c[1] - s[1]) * morph;
    const z = s[2] + (c[2] - s[2]) * morph;
    const rx = x * cosY - z * sinY;
    const rz = x * sinY + z * cosY;
    const ry = y * cosX - rz * sinX;
    const depth = y * sinX + rz * cosX;
    const perspective = 3.5 / (3.5 - depth);
    return { x: width / 2 + rx * scale * perspective, y: height / 2 + ry * scale * perspective, z: depth, size: (1.15 + ((depth + 1.3) / 2.6) * 1.85) * perspective };
  }).sort((a, b) => a.z - b.z);
  const glow = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, scale * 1.6);
  glow.addColorStop(0, '#ff304b08'); glow.addColorStop(1, '#ff304b00');
  context.fillStyle = glow; context.fillRect(0, 0, width, height);
  for (const point of points) {
    const alpha = Math.min(1, Math.max(.14, (point.z + 1.4) / 2.4));
    context.fillStyle = `rgba(255,${Math.round(55 + alpha * 38)},${Math.round(79 + alpha * 37)},${alpha})`;
    context.fillRect(Math.round(point.x), Math.round(point.y), Math.round(point.size), Math.round(point.size));
  }
}
function animate(time) {
  if (motionPaused || !inView || document.hidden) { frame = undefined; return; }
  const elapsed = Math.min(40, time - (lastFrame || time)); lastFrame = time;
  if (!dragging) rotationY += elapsed * .00014;
  morph += ((shape === 'cube' ? 1 : 0) - morph) * .045;
  drawCore(); frame = requestAnimationFrame(animate);
}
function startAnimation() { if (!frame && !motionPaused && inView && !document.hidden) { lastFrame = 0; frame = requestAnimationFrame(animate); } }
function setMotion(paused) {
  motionPaused = paused;
  document.body.classList.toggle('motion-paused', paused);
  $('.motion-toggle').setAttribute('aria-pressed', String(paused));
  $('.motion-toggle').setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
  $('.motion-toggle').innerHTML = paused ? '<span aria-hidden="true">▷</span>' : '<span aria-hidden="true">Ⅱ</span>';
  if (paused) { cancelAnimationFrame(frame); frame = undefined; } else startAnimation();
}
$('.motion-toggle').addEventListener('click', () => setMotion(!motionPaused));
reducedMotion.addEventListener('change', event => setMotion(event.matches));
$$('[data-shape]').forEach(button => button.addEventListener('click', () => {
  shape = button.dataset.shape;
  $$('[data-shape]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  if (motionPaused) { morph = shape === 'cube' ? 1 : 0; drawCore(); }
}));
canvas.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  dragging = true; dragX = event.clientX; dragY = event.clientY; canvas.classList.add('dragging');
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!dragging) return;
  rotationY += (event.clientX - dragX) * .009;
  rotationX += (event.clientY - dragY) * .006;
  dragX = event.clientX; dragY = event.clientY; drawCore();
});
function stopDragging() { dragging = false; canvas.classList.remove('dragging'); }
canvas.addEventListener('pointerup', stopDragging); canvas.addEventListener('pointercancel', stopDragging);
canvas.addEventListener('lostpointercapture', stopDragging);
new ResizeObserver(resizeCanvas).observe(canvas);
new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) startAnimation(); }, { threshold: .05 }).observe(canvas);
document.addEventListener('visibilitychange', startAnimation);
setMotion(motionPaused); resizeCanvas(); startAnimation();

if (!reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach(element => { element.classList.add('will-reveal'); revealObserver.observe(element); });
}
let scrollQueued = false;
function onScroll() {
  if (scrollQueued) return; scrollQueued = true;
  requestAnimationFrame(() => {
    const scrollRange = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress').style.transform = `scaleX(${scrollRange > 0 ? scrollY / scrollRange : 0})`;
    const sections = ['work', 'about', 'experience', 'contact'];
    let current = '';
    for (const id of sections) { if ($(`#${id}`).getBoundingClientRect().top <= innerHeight * .4) current = id; }
    $$('.desktop-nav a').forEach(link => { if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    scrollQueued = false;
  });
}
document.addEventListener('scroll', onScroll, { passive: true }); onScroll();
