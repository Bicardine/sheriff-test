const el = (id) => document.getElementById(id);
const KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const DENY_LINES = [
  "показатель живёт своей жизнью",
  "шкала решила иначе",
  "данные уточнились",
  "он сам себя так оценил",
  "замер поплыл, бывает"
];

const state = { i: 0, answers: [], shown: [], depression: 50 };

let sliderAnim = null;
let sliderIdle = null;

function stopSliderAnim() {
  if (sliderAnim) { window.clearInterval(sliderAnim); sliderAnim = null; }
}

function stopSlider() {
  stopSliderAnim();
  if (sliderIdle) { window.clearInterval(sliderIdle); sliderIdle = null; }
}

const maxima = (() => {
  const m = {};
  AXES.forEach((a) => {
    m[a.key] = QUESTIONS.reduce((sum, q) => {
      const vals = q.a.map((o) => o.w[a.key] || 0);
      if (q.type === "multi") return sum + vals.reduce((x, y) => x + y, 0);
      return sum + Math.max.apply(null, vals);
    }, 0);
  });
  return m;
})();

const store = {
  get(k, d) {
    try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { return; }
  }
};

const sound = { ctx: null, on: store.get("zt_sfx", "1") === "1" };

function ac() {
  if (!sound.ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    sound.ctx = new C();
  }
  if (sound.ctx.state === "suspended") sound.ctx.resume();
  return sound.ctx;
}

function tone(freq, dur, type, vol, delay) {
  if (!sound.on) return;
  const ctx = ac();
  if (!ctx) return;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const sfx = {
  hover() { tone(1180, 0.05, "sine", 0.022); },
  click() { tone(520, 0.07, "square", 0.045); tone(980, 0.09, "triangle", 0.035, 0.05); },
  tick() { tone(1500, 0.04, "square", 0.03); },
  back() { tone(330, 0.09, "sine", 0.04); },
  done() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.05, i * 0.09)); }
};

const TRACKS = { boot: "music/boot.mp3", intro: "music/intro.mp3", loop: "music/loop.mp3" };
const music = { el: null, want: true, stage: "boot", dead: false };

function initMusic() {
  const a = new Audio();
  a.volume = 0.38;
  a.preload = "auto";
  a.addEventListener("ended", () => { if (music.stage === "intro") playStage("loop"); });
  a.addEventListener("error", () => { music.dead = true; paintMusic(); });
  music.el = a;
}

function tryPlay() {
  if (!music.el || !music.want) return;
  const p = music.el.play();
  if (p && p.catch) p.catch(() => {});
}

function playStage(stage) {
  if (music.dead) return;
  music.stage = stage;
  music.el.src = TRACKS[stage];
  music.el.loop = stage === "loop";
  tryPlay();
}

function paintMusic() {
  const b = el("music");
  if (music.dead) {
    b.textContent = "музыка: нет файла";
    b.disabled = true;
    b.classList.remove("on");
    return;
  }
  b.textContent = music.want ? "музыка: вкл" : "музыка: выкл";
  b.classList.toggle("on", music.want);
}

function setMusic(on) {
  music.want = on;
  store.set("zt_music", on ? "1" : "0");
  if (on) tryPlay(); else if (music.el) music.el.pause();
  paintMusic();
}

const fxLayer = () => el("fx");

function spawn(node, ms) {
  fxLayer().appendChild(node);
  window.setTimeout(() => node.remove(), ms);
}

function originOf(target) {
  if (!target || !target.getBoundingClientRect) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = target.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function floats(target, chars, count) {
  const o = originOf(target);
  const n = count || 8;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "fl";
    s.textContent = chars[i % chars.length];
    s.style.left = o.x + (Math.random() * 180 - 90) + "px";
    s.style.top = o.y + (Math.random() * 40 - 20) + "px";
    s.style.setProperty("--dx", (Math.random() * 160 - 80).toFixed(0) + "px");
    s.style.setProperty("--rot", (Math.random() * 120 - 60).toFixed(0) + "deg");
    s.style.animationDelay = (i * 0.045).toFixed(2) + "s";
    s.style.fontSize = (22 + Math.random() * 20).toFixed(0) + "px";
    spawn(s, 1500);
  }
}

function banner(text, cls) {
  const d = document.createElement("div");
  d.className = "banner" + (cls ? " " + cls : "");
  d.textContent = text;
  spawn(d, 1300);
}

function flash(cls) {
  const d = document.createElement("div");
  d.className = "flash" + (cls ? " " + cls : "");
  spawn(d, 750);
}

function letterbox() {
  const t = document.createElement("div");
  t.className = "lb t";
  const b = document.createElement("div");
  b.className = "lb b";
  spawn(t, 1400);
  spawn(b, 1400);
}

function rays() {
  const d = document.createElement("div");
  d.className = "rays";
  spawn(d, 1200);
}

function crewmate() {
  const d = document.createElement("div");
  d.className = "crew";
  d.style.top = (window.innerHeight * 0.35 + Math.random() * 120) + "px";
  spawn(d, 1400);
}

function censorBars() {
  const q = el("question").getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("div");
    d.className = "bar-censor";
    d.style.left = (q.left + Math.random() * 40) + "px";
    d.style.top = (q.top + i * 30) + "px";
    d.style.width = Math.max(120, q.width * (0.5 + Math.random() * 0.45)) + "px";
    d.style.animationDelay = (i * 0.06).toFixed(2) + "s";
    spawn(d, 1100);
  }
}

function shake() {
  const w = document.querySelector(".wrap");
  w.classList.remove("shake");
  void w.offsetWidth;
  w.classList.add("shake");
  window.setTimeout(() => w.classList.remove("shake"), 500);
}

const FX = {
  voice: (t) => floats(t, ["🎧", "🎙️", "💤"], 9),
  impostor: (t) => { crewmate(); banner("ШЕРИФ МЁРТВ", "red"); shake(); },
  ghost: (t) => floats(t, ["👻", "🕯️"], 11),
  gacha: (t) => { letterbox(); flash(); floats(t, ["✦", "⭐", "💎"], 12); },
  ping: (t) => floats(t, ["💬", "🔔"], 9),
  censor: () => { censorBars(); shake(); },
  spine: (t) => { banner("ХРЕБЕТ НЕ НАЙДЕН", "cyan"); floats(t, ["🦴"], 7); },
  serbia: (t) => floats(t, ["🥃", "🍑", "🏔️"], 9),
  paw: (t) => floats(t, ["🐾", "🦴"], 12),
  stamp: (t, opt) => { banner(opt && opt.t.length < 26 ? opt.t.toUpperCase() : "ПРИНЯТО"); floats(t, ["💢"], 5); },
  banana: (t) => floats(t, ["🍌"], 14),
  check: (t) => floats(t, ["✅", "📦"], 9),
  gift: (t) => { floats(t, ["🎁", "✨", "💌"], 12); },
  death: () => { flash("red"); banner("ВЫ УМЕРЛИ", "red"); shake(); },
  moon: (t) => floats(t, ["🌙", "💤", "📱"], 10),
  hearts: (t) => floats(t, ["💗", "💘", "💞"], 12),
  rays: (t) => { rays(); floats(t, ["✦"], 8); },
  tasks: (t) => floats(t, ["📋", "🔧", "⚡"], 9),
  fem: (t) => floats(t, ["♀", "✊", "💅"], 10),
  rainbow: (t) => { floats(t, ["🌈", "🩲", "✨"], 12); flash(); },
  mood: (t) => { floats(t, ["🙂", "🙃", "😐", "💊"], 10); shake(); },
  kinks: (t) => floats(t, ["💅", "💋", "🖤", "🧹"], 10),
  traits: (t) => floats(t, ["⭐", "💢"], 10),
  final: (t) => { flash(); banner("ВЕРДИКТ", "cyan"); shake(); }
};

function runFx(q, target, opt) {
  const fn = FX[q.fx];
  if (fn) fn(target, opt);
}

function toast(text) {
  const box = el("toasts");
  const d = document.createElement("div");
  d.className = "toast";
  const img = document.createElement("img");
  img.src = "img/bic.png";
  img.alt = "Сообщение от Шерифа";
  const p = document.createElement("p");
  p.textContent = text;
  d.appendChild(img);
  d.appendChild(p);
  d.addEventListener("click", () => close());
  box.appendChild(d);
  tone(760, 0.08, "sine", 0.05);
  tone(1020, 0.1, "sine", 0.04, 0.08);
  let gone = false;
  function close() {
    if (gone) return;
    gone = true;
    d.classList.add("out");
    window.setTimeout(() => d.remove(), 320);
  }
  window.setTimeout(close, 6000);
}

function show(name) {
  ["intro", "quiz", "result"].forEach((s) => { el(s).hidden = s !== name; });
}

function isMulti(q) { return q.type === "multi"; }

function selected(qi) {
  const v = state.answers[qi];
  if (Array.isArray(v)) return v;
  return [];
}

function renderQuestion() {
  const q = QUESTIONS[state.i];
  const n = state.i + 1;
  el("counter").textContent = "вопрос " + String(n).padStart(2, "0") + " / " + QUESTIONS.length;
  el("topic").textContent = q.topic;
  el("track-fill").style.width = Math.round((state.i / QUESTIONS.length) * 100) + "%";
  el("question").textContent = q.q;
  el("back").disabled = state.i === 0;

  const note = el("qnote");
  note.hidden = !q.note;
  if (q.note) note.textContent = q.note;

  const troll = q.type === "troll";
  syncNext(q);
  el("hint").textContent = troll
    ? "форма работает как хочет"
    : isMulti(q)
      ? "отмечай галочками, потом жми готово"
      : "можно нажимать цифры на клавиатуре";

  hideMe();
  stopSlider();

  const box = el("options");
  box.textContent = "";

  if (troll) {
    renderTroll(q, box);
    const c0 = el("card");
    c0.classList.remove("in");
    void c0.offsetWidth;
    c0.classList.add("in");
    busy = false;
    if (state.shown[state.i]) revealMe(q);
    paintHud();
    return;
  }

  const groups = q.groups || [{ key: null, name: null }];
  groups.forEach((g) => {
    if (g.name) {
      const h = document.createElement("p");
      h.className = "grp grp-" + g.key;
      h.textContent = g.name;
      box.appendChild(h);
    }
    q.a.forEach((opt, idx) => {
      if (g.key && opt.g !== g.key) return;
      box.appendChild(optionNode(q, opt, idx));
    });
  });

  const card = el("card");
  card.classList.remove("in");
  void card.offsetWidth;
  card.classList.add("in");
  busy = false;
  if (state.shown[state.i]) revealMe(q);
  paintHud();
}

function syncNext(q) {
  const b = el("next");
  if (isMulti(q)) {
    b.hidden = false;
    b.textContent = state.shown[state.i] ? "Дальше" : "Готово";
    return;
  }
  b.hidden = !state.shown[state.i];
  b.textContent = "Дальше";
}

function hideMe() {
  el("me-box").hidden = true;
  el("me-list").hidden = true;
  el("me-note").hidden = true;
  el("me-match").hidden = true;
}

function revealMe(q) {
  if (q.me === undefined && !q.meText) { hideMe(); return; }
  const box = el("me-box");
  const list = el("me-list");
  const note = el("me-note");
  const match = el("me-match");
  const text = el("me-text");
  list.textContent = "";
  el("me-title").textContent = q.meTitle || "Shrf";
  text.classList.toggle("me-blur", !!q.meBlur);

  if (q.meText) {
    text.textContent = q.meText;
    list.hidden = true;
    match.hidden = true;
  } else if (Array.isArray(q.me)) {
    text.textContent = "Он отметил " + q.me.length + " из " + q.a.length + ":";
    q.me.forEach((i) => {
      const li = document.createElement("li");
      li.className = q.a[i].g || "";
      li.textContent = q.a[i].t;
      list.appendChild(li);
    });
    list.hidden = false;
    const mine = selected(state.i);
    const same = q.me.filter((i) => mine.indexOf(i) >= 0).length;
    match.hidden = same === 0;
    match.textContent = "совпало пунктов: " + same;
  } else {
    text.textContent = q.a[q.me].t;
    list.hidden = true;
    const same = state.answers[state.i] === q.me;
    match.hidden = !same;
    match.textContent = "вы выбрали одно и то же";
  }

  note.hidden = !q.meNote;
  note.textContent = q.meNote || "";

  box.hidden = false;
  box.classList.remove("in");
  void box.offsetWidth;
  sfx.tick();
}

function afterAnswer(q) {
  if (state.shown[state.i]) {
    revealMe(q);
    return;
  }
  window.setTimeout(() => {
    if (state.answers[state.i] === undefined) return;
    state.shown[state.i] = true;
    revealMe(q);
    syncNext(q);
  }, 900);
}

function renderTroll(q, box) {
  const wrap = document.createElement("div");
  wrap.className = "troll";

  const row = document.createElement("div");
  row.className = "troll-row";
  const btns = [];
  q.a.forEach((opt, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "troll-btn" + (state.answers[state.i] === idx ? " on" : "");
    b.dataset.idx = String(idx);
    b.textContent = opt.t;
    b.addEventListener("mouseenter", sfx.hover);
    b.addEventListener("click", () => trollPick(q, idx, btns));
    btns.push(b);
    row.appendChild(b);
  });
  wrap.appendChild(row);

  const sb = document.createElement("div");
  sb.className = "slider-box";

  const k = document.createElement("div");
  k.className = "slider-k";
  const kl = document.createElement("span");
  kl.textContent = q.slider;
  const kv = document.createElement("b");
  kv.textContent = state.depression + "%";
  k.appendChild(kl);
  k.appendChild(kv);

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "100";
  range.step = "1";
  range.value = String(state.depression);

  const note = document.createElement("p");
  note.className = "slider-note";

  let hovering = false;
  let dragging = false;

  const setVal = (v) => {
    const n = Math.max(0, Math.min(100, Math.round(v)));
    state.depression = n;
    range.value = String(n);
    kv.textContent = n + "%";
  };

  const glide = (to, ms, text) => {
    stopSliderAnim();
    const from = state.depression;
    const t0 = Date.now();
    if (text) note.textContent = text;
    sliderAnim = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setVal(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p >= 1) stopSliderAnim();
    }, 16);
  };

  const line = () => DENY_LINES[Math.floor(Math.random() * DENY_LINES.length)];

  range.addEventListener("input", () => {
    stopSliderAnim();
    note.textContent = "";
    setVal(parseInt(range.value, 10));
  });

  range.addEventListener("pointerdown", () => { dragging = true; stopSliderAnim(); });
  range.addEventListener("pointerenter", () => { hovering = true; });
  range.addEventListener("pointerleave", () => { hovering = false; });
  range.addEventListener("change", () => {
    dragging = false;
    glide(Math.floor(Math.random() * 101), 850, line());
    sfx.back();
  });

  stopSlider();
  sliderIdle = window.setInterval(() => {
    if (hovering || dragging) return;
    if (Math.random() < 0.55) return;
    glide(Math.floor(Math.random() * 101), 1200, line());
  }, 4200);

  sb.appendChild(k);
  sb.appendChild(range);
  sb.appendChild(note);
  wrap.appendChild(sb);
  box.appendChild(wrap);
}

function trollPick(q, idx, btns) {
  const other = idx === 0 ? 1 : 0;
  const clicked = btns[idx];
  const tag = document.createElement("span");
  tag.className = "deny-tag";
  tag.textContent = "отказано";
  clicked.appendChild(tag);
  clicked.classList.add("deny");
  window.setTimeout(() => { clicked.classList.remove("deny"); tag.remove(); }, 760);

  btns.forEach((b, i) => b.classList.toggle("on", i === other));
  state.answers[state.i] = other;
  sfx.tick();
  runFx(q, clicked, q.a[other]);
  const opt = q.a[other];
  if (opt.bic) window.setTimeout(() => toast(opt.bic), 600);
  paintHud();
  afterAnswer(q);
}

function optionNode(q, opt, idx) {
  const b = document.createElement("button");
  b.type = "button";
  const multi = isMulti(q);
  const on = multi ? selected(state.i).indexOf(idx) >= 0 : state.answers[state.i] === idx;
  b.className = "opt" + (on ? " on" : "") + (opt.g ? " opt-" + opt.g : "");
  b.dataset.idx = String(idx);

  const mark = document.createElement("span");
  if (multi) {
    mark.className = "opt-box";
    mark.textContent = on ? "x" : "";
  } else {
    mark.className = "opt-k";
    mark.textContent = KEYS[idx];
  }

  if (opt.color) {
    const dot = document.createElement("span");
    dot.className = "opt-dot";
    dot.style.background = opt.color;
    b.appendChild(dot);
  }

  const t = document.createElement("span");
  t.textContent = opt.t;
  if (opt.glitch) {
    t.className = "opt-glitch";
    const tail = document.createElement("span");
    tail.className = "gl-tail";
    tail.textContent = opt.glitch;
    t.appendChild(tail);
  }
  b.appendChild(mark);
  b.appendChild(t);
  b.addEventListener("mouseenter", sfx.hover);
  b.addEventListener("click", () => pick(idx, b));
  return b;
}

let busy = false;

function pick(idx, node) {
  const q = QUESTIONS[state.i];
  const opt = q.a[idx];

  if (isMulti(q)) {
    const cur = selected(state.i).slice();
    const at = cur.indexOf(idx);
    if (at >= 0) cur.splice(at, 1); else cur.push(idx);
    state.answers[state.i] = cur;
    const on = at < 0;
    node.classList.toggle("on", on);
    const box = node.querySelector(".opt-box");
    if (box) box.textContent = on ? "x" : "";
    sfx.tick();
    if (on) {
      runFx(q, node, opt);
      if (opt.bic) window.setTimeout(() => toast(opt.bic), 350);
    }
    paintHud();
    return;
  }

  state.answers[state.i] = idx;
  const nodes = el("options").children;
  for (let i = 0; i < nodes.length; i++) nodes[i].classList.toggle("on", nodes[i] === node);
  sfx.click();
  runFx(q, node, opt);
  if (opt.bic) window.setTimeout(() => toast(opt.bic), 420);
  paintHud();
  afterAnswer(q);
}

function advance() {
  if (state.i < QUESTIONS.length - 1) {
    state.i += 1;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    finish();
  }
}

function rawScores() {
  const raw = {};
  AXES.forEach((a) => (raw[a.key] = 0));
  QUESTIONS.forEach((q, qi) => {
    const ans = state.answers[qi];
    if (ans === undefined) return;
    const picked = Array.isArray(ans) ? ans.map((i) => q.a[i]) : [q.a[ans]];
    picked.forEach((opt) => {
      if (!opt) return;
      AXES.forEach((a) => { raw[a.key] += opt.w[a.key] || 0; });
    });
  });
  return raw;
}

function scores() {
  const raw = rawScores();
  return AXES.map((a) => ({
    key: a.key,
    name: a.name,
    hint: a.hint,
    raw: raw[a.key],
    max: maxima[a.key],
    pct: maxima[a.key] ? Math.min(100, Math.round((raw[a.key] / maxima[a.key]) * 100)) : 0
  }));
}

function paintHud() {
  const raw = rawScores();
  const love = Math.min(100, Math.round(((raw.dog + raw.simp) / (maxima.dog + maxima.simp)) * 100));
  const res = Math.min(100, Math.round(((raw.alpha + raw.gremlin) / (maxima.alpha + maxima.gremlin)) * 100));
  el("hud-love").style.width = love + "%";
  el("hud-stress").style.width = res + "%";
  el("hud-love-v").textContent = love + "%";
  el("hud-stress-v").textContent = res + "%";
}

function verdict(list) {
  const sorted = list.slice().sort((x, y) => y.pct - x.pct);
  const top = sorted[0];
  const second = sorted[1];
  const prim = PRIMARIES[top.key];
  const isPure = top.pct - second.pct >= 25 && second.pct < 38;
  return {
    top: top,
    second: second,
    title: isPure ? prim.pure : prim.short + "-" + MODS[second.key].suffix,
    line: prim.line,
    blurb: prim.blurb,
    mod: isPure ? "Ни одна другая шкала даже не приблизилась. Тут всё решено." : MODS[second.key].line,
    dx: prim.dx,
    stamp: STAMPS[top.key]
  };
}

function renderBars(list) {
  const sorted = list.slice().sort((x, y) => y.pct - x.pct);
  const box = el("bars");
  box.textContent = "";
  const fills = [];
  sorted.forEach((s, idx) => {
    const row = document.createElement("div");
    row.className = "row";

    const top = document.createElement("div");
    top.className = "row-top";

    const name = document.createElement("span");
    name.className = "row-name";
    name.textContent = s.name;
    if (idx === 0) {
      const lead = document.createElement("span");
      lead.className = "lead";
      lead.textContent = "лидер";
      name.appendChild(lead);
    }

    const val = document.createElement("span");
    val.className = "row-val";
    val.textContent = s.pct + "% ";
    const sub = document.createElement("i");
    sub.textContent = s.raw + " из " + s.max;
    val.appendChild(sub);

    top.appendChild(name);
    top.appendChild(val);

    const hint = document.createElement("div");
    hint.className = "row-hint";
    hint.textContent = s.hint;

    const track = document.createElement("div");
    track.className = "row-track";
    const fill = document.createElement("div");
    fill.className = "row-fill";
    track.appendChild(fill);
    fills.push([fill, s.pct]);

    row.appendChild(top);
    row.appendChild(hint);
    row.appendChild(track);
    box.appendChild(row);
  });
  window.requestAnimationFrame(() => {
    fills.forEach((p) => (p[0].style.width = Math.max(p[1], 1.5) + "%"));
  });
}

function renderRadar(list) {
  const cx = 170;
  const cy = 140;
  const r = 80;
  const n = AXES.length;
  const at = (i, rad) => {
    const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad];
  };
  const ring = (rad) =>
    Array.from({ length: n }, (_, i) => at(i, rad).map((v) => v.toFixed(1)).join(",")).join(" ");

  let svg = '<svg viewBox="0 0 340 282" role="img" aria-label="Шесть шкал Шерифа в виде лепестковой диаграммы">';
  [0.25, 0.5, 0.75, 1].forEach((f) => {
    svg += '<polygon points="' + ring(r * f) + '" fill="none" stroke="#1b1218" stroke-opacity="0.16" stroke-width="1"></polygon>';
  });
  for (let i = 0; i < n; i++) {
    const p = at(i, r);
    svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="#1b1218" stroke-opacity="0.16" stroke-width="1"></line>';
  }

  const pts = list.map((s, i) => at(i, (Math.max(s.pct, 2) / 100) * r));
  svg += '<polygon points="' + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ") + '" fill="#ff2e88" fill-opacity="0.24" stroke="#ff2e88" stroke-width="2" stroke-linejoin="round"></polygon>';

  pts.forEach((p, i) => {
    svg += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" fill="#ff2e88" stroke="#fffaf4" stroke-width="2"><title>' + list[i].name + ": " + list[i].pct + '%</title></circle>';
  });

  list.forEach((s, i) => {
    const p = at(i, r + 26);
    svg += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] - 1).toFixed(1) + '" text-anchor="middle" font-family="Unbounded, sans-serif" font-size="10" font-weight="600" fill="#1b1218">' + s.name + "</text>";
    svg += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 12).toFixed(1) + '" text-anchor="middle" font-family="Unbounded, sans-serif" font-size="10" fill="#7a6a72">' + s.pct + "%</text>";
  });

  svg += "</svg>";
  el("radar").innerHTML = svg;
}

function renderTiles(list) {
  const byKey = {};
  list.forEach((s) => (byKey[s.key] = s));
  const box = el("tiles");
  box.textContent = "";
  TILES.forEach((t) => {
    const pct = byKey[t.key].pct;
    const cap = t.caps.find((c) => pct >= c[0])[1];
    const d = document.createElement("div");
    d.className = "tile";
    const k = document.createElement("p");
    k.className = "tile-k";
    k.textContent = t.name;
    const v = document.createElement("p");
    v.className = "tile-v";
    v.textContent = pct + "%";
    const s = document.createElement("p");
    s.className = "tile-s";
    s.textContent = cap;
    d.appendChild(k);
    d.appendChild(v);
    d.appendChild(s);
    box.appendChild(d);
  });

  const dep = state.depression;
  const d = document.createElement("div");
  d.className = "tile";
  const k = document.createElement("p");
  k.className = "tile-k";
  k.textContent = "Уровень депрессии";
  const v = document.createElement("p");
  v.className = "tile-v";
  v.textContent = dep + "%";
  const s = document.createElement("p");
  s.className = "tile-s";
  s.textContent = DEPRESSION_CAPS.find((c) => dep >= c[0])[1];
  d.appendChild(k);
  d.appendChild(v);
  d.appendChild(s);
  box.appendChild(d);
}

function h32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function keyStream(seed, n) {
  let x = (seed ^ 0x9e3779b9) >>> 0;
  if (!x) x = 0x6d2b79f5;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    out[i] = x & 255;
  }
  return out;
}

function decodeSecret(pass, b64) {
  if (!pass) return null;
  try {
    const bin = atob(b64);
    const all = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) all[i] = bin.charCodeAt(i);
    const sum = (all[0] | (all[1] << 8) | (all[2] << 16) | (all[3] << 24)) >>> 0;
    const body = all.subarray(4);
    const key = keyStream(h32("zt:" + pass), body.length);
    const out = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) out[i] = body[i] ^ key[i];
    const json = new TextDecoder().decode(out);
    if (h32(json) !== sum) return null;
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

let censData = null;

function renderCensored() {
  if (!censData) return;
  const box = el("cens-words");
  box.textContent = "";
  el("cens-words-title").textContent = censData.wordsTitle;
  el("cens-words-note").textContent = censData.wordsNote;
  censData.words.forEach((w) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "word";
    b.textContent = w;
    b.addEventListener("mouseenter", sfx.hover);
    b.addEventListener("click", () => {
      if (b.classList.contains("open")) return;
      b.classList.add("open");
      sfx.tick();
      floats(b, ["🖤"], 5);
    });
    box.appendChild(b);
  });
  el("cens-text").textContent = censData.text;
}

function unlockCensored(data) {
  censData = data;
  el("cens-lock").hidden = true;
  el("cens-body").hidden = false;
  renderCensored();
}

function openModal() {
  el("modal-hint").textContent = CENSORED.hint;
  el("pass").value = "";
  el("pass-note").textContent = "";
  el("pass-note").classList.remove("ok");
  el("modal").hidden = false;
  el("pass").focus();
}

function closeModal() {
  el("modal").hidden = true;
}

function checkPass() {
  const v = el("pass").value.trim();
  const data = decodeSecret(v, CENSORED.payload);
  if (data) {
    store.set("zt_pass", v);
    el("pass-note").textContent = "Принято. Шериф всё-таки проговорился.";
    el("pass-note").classList.add("ok");
    sfx.done();
    window.setTimeout(() => { closeModal(); unlockCensored(data); }, 700);
    return;
  }
  el("pass-note").classList.remove("ok");
  el("pass-note").textContent = CENSORED.deny;
  sfx.back();
  const box = document.querySelector(".modal-box");
  box.classList.remove("shake");
  void box.offsetWidth;
  box.classList.add("shake");
  window.setTimeout(() => box.classList.remove("shake"), 500);
}

function multiIndex(fx) {
  for (let i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].fx === fx) return i;
  return -1;
}

function renderPicked(fx, listId, winId) {
  const qi = multiIndex(fx);
  const win = el(winId);
  const box = el(listId);
  box.textContent = "";
  if (qi < 0) { win.hidden = true; return []; }
  const q = QUESTIONS[qi];
  const picks = selected(qi);
  win.hidden = picks.length === 0;
  const out = [];
  picks.slice().sort((a, b) => a - b).forEach((i) => {
    const opt = q.a[i];
    const li = document.createElement("li");
    li.className = opt.g || "";
    li.textContent = opt.t;
    box.appendChild(li);
    out.push(opt.t);
  });
  return out;
}

let lastSummary = "";

function finish() {
  const list = scores();
  const v = verdict(list);
  el("verdict-title").textContent = v.title;
  el("verdict-line").textContent = v.line;
  el("verdict-blurb").textContent = v.blurb;
  el("verdict-mod").textContent = v.mod;
  el("verdict-dx").textContent = v.dx;
  el("stamp-line").textContent = v.stamp;
  el("copy-note").textContent = "";
  renderBars(list);
  renderRadar(list);
  renderTiles(list);
  const rights = renderPicked("kinks", "rights", "rights-win");
  const traits = renderPicked("traits", "traits", "traits-win");

  const sorted = list.slice().sort((x, y) => y.pct - x.pct);
  lastSummary =
    "Тест: Кто тебе Шериф?\n" +
    "Вердикт: " + v.title + "\n" +
    sorted.map((s) => s.name + " " + s.pct + "%").join(" | ") + "\n" +
    "Уровень депрессии: " + state.depression + "%\n" +
    v.dx +
    (rights.length ? "\nРазрешено: " + rights.join(", ") : "") +
    (traits.length ? "\nХарактеристика: " + traits.join(", ") : "");

  show("result");
  window.scrollTo({ top: 0, behavior: "smooth" });
  flash();
  banner("ВЕРДИКТ", "cyan");
  sfx.done();
  window.setTimeout(() => toast(BIC_FINAL[v.top.key]), 1200);
}

function typeMother() {
  const box = el("dlg");
  const out = el("dlg-text");
  let li = 0;
  let ci = 0;
  let timer = null;

  function step() {
    const line = MOTHER_LINES[li];
    ci += 1;
    out.textContent = line.slice(0, ci);
    if (ci >= line.length) {
      li += 1;
      ci = 0;
      if (li >= MOTHER_LINES.length) { box.classList.add("done"); return; }
      timer = window.setTimeout(step, 1100);
      return;
    }
    timer = window.setTimeout(step, 32);
  }

  box.addEventListener("click", () => {
    window.clearTimeout(timer);
    out.textContent = MOTHER_LINES[MOTHER_LINES.length - 1];
    box.classList.add("done");
    li = MOTHER_LINES.length;
  });

  step();
}

function clock() {
  const d = new Date();
  el("clock").textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

el("start").addEventListener("click", () => {
  state.i = 0;
  state.answers = [];
  state.shown = [];
  state.depression = 50;
  sfx.click();
  playStage("intro");
  show("quiz");
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

el("back").addEventListener("click", () => {
  if (state.i === 0) return;
  state.i -= 1;
  sfx.back();
  renderQuestion();
});

function nextStep() {
  const q = QUESTIONS[state.i];
  sfx.click();
  if (!state.shown[state.i]) {
    state.shown[state.i] = true;
    revealMe(q);
    syncNext(q);
    return;
  }
  advance();
}

el("next").addEventListener("click", nextStep);

el("again").addEventListener("click", () => {
  state.i = 0;
  state.answers = [];
  state.shown = [];
  state.depression = 50;
  stopSlider();
  sfx.back();
  show("intro");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

el("copy").addEventListener("click", async () => {
  sfx.click();
  try {
    await navigator.clipboard.writeText(lastSummary);
    el("copy-note").textContent = "Скопировано. Можно вставлять в чат.";
  } catch (e) {
    el("copy-note").textContent = "Браузер не дал доступ к буферу. Выдели текст и скопируй руками.";
  }
});

el("music").addEventListener("click", () => {
  ac();
  setMusic(!music.want);
  sfx.tick();
});

el("sfx").addEventListener("click", () => {
  sound.on = !sound.on;
  store.set("zt_sfx", sound.on ? "1" : "0");
  el("sfx").textContent = sound.on ? "звуки: вкл" : "звуки: выкл";
  el("sfx").classList.toggle("on", sound.on);
  if (sound.on) sfx.tick();
});

el("cens-open").addEventListener("click", () => {
  sfx.click();
  const saved = decodeSecret(store.get("zt_pass", ""), CENSORED.payload);
  if (saved) { unlockCensored(saved); return; }
  openModal();
});

el("cens-hide").addEventListener("click", () => {
  sfx.back();
  el("cens-body").hidden = true;
  el("cens-lock").hidden = false;
});

el("pass-go").addEventListener("click", checkPass);
el("modal-close").addEventListener("click", () => { sfx.back(); closeModal(); });
el("modal-x").addEventListener("click", () => { sfx.back(); closeModal(); });
el("pass").addEventListener("keydown", (e) => { if (e.key === "Enter") checkPass(); });

document.addEventListener("keydown", (e) => {
  if (!el("modal").hidden && e.key === "Escape") { closeModal(); return; }
  if (el("quiz").hidden) return;
  const q = QUESTIONS[state.i];
  if (e.key === "Enter") {
    if (!el("next").hidden) nextStep();
    return;
  }
  if (q.type === "troll") return;
  if (e.key === "Backspace" && state.i > 0) {
    e.preventDefault();
    state.i -= 1;
    sfx.back();
    renderQuestion();
    return;
  }
  const n = "123456789".indexOf(e.key);
  if (n < 0 || n >= q.a.length) return;
  const node = el("options").querySelector('[data-idx="' + n + '"]');
  if (node) pick(n, node);
});

document.querySelectorAll(".big-btn, .min-btn, .tb-btn").forEach((b) => {
  b.addEventListener("mouseenter", sfx.hover);
});

el("sfx").textContent = sound.on ? "звуки: вкл" : "звуки: выкл";
el("sfx").classList.toggle("on", sound.on);
music.want = store.get("zt_music", "1") === "1";
initMusic();
playStage("boot");
paintMusic();
document.addEventListener("pointerdown", function once() {
  document.removeEventListener("pointerdown", once);
  ac();
  tryPlay();
}, true);
typeMother();
clock();
window.setInterval(clock, 20000);
window.setTimeout(() => el("big-title").classList.add("go"), 400);
show("intro");
