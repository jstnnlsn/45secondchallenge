/* Behavior only. index.html is the frame. styles.css is the look.
   The page starts as a fight. Each monster you beat reveals one
   part of the personal dossier. Nothing here blocks the tab. */

const PERSON = {
  name: "Justin Nelson Pañe",
  city: "Cebu City",
  region: "Central Visayas, Philippines",
  line: "I build pages that have to earn the minute you almost didn't give them.",
};

const INTENTS = {
  slam: { name: "Slam", hint: "Heavy. Guard cuts it down.", range: "8–10" },
  rake: { name: "Rake", hint: "Quicker. Guard only helps a little.", range: "5–7" },
  brace: { name: "Brace", hint: "It mends, and your next Strike glances.", range: "heals 6" },
};

const MONSTERS = [
  {
    id: "redactor",
    name: "The Redactor",
    epithet: "Sits on the line that says where you're from",
    art: "art/redactor.jpg",
    alt: "A torn-paper wraith with a blank gold mask and ink-black claws",
    hp: 16,
    revealId: "place",
    entrance: "The Redactor is already winding up. Telegraph says Slam.",
    fall: "The ink peels back. The city was under it the whole time.",
  },
  {
    id: "glassmouth",
    name: "Glassmouth",
    epithet: "Keeps the portrait behind its teeth",
    art: "art/glassmouth.jpg",
    alt: "A fanged beast pressing through a cracked gold mirror",
    hp: 32,
    revealId: "portrait",
    entrance: "Glassmouth smiles with too many teeth. It wants a Slam.",
    fall: "The mirror gives. A painted face is left in the frame.",
  },
  {
    id: "distractions",
    name: "The Three Distractions",
    epithet: "Scroll, Skip, and Close — hobbies, if they win",
    art: "art/hydra.jpg",
    alt: "A three-headed serpent: a phone, a blank scroll, and a shuttered eye",
    hp: 40,
    revealId: "life",
    entrance: "Three heads. One telegraph. Don't negotiate with all of them.",
    fall: "The heads drop. What you do with a free hour stays on the page.",
  },
  {
    id: "plaque",
    name: "The Empty Plaque",
    epithet: "A résumé with nothing carved",
    art: "art/plaque.jpg",
    alt: "A stone colossus armored in blank plaques, split by a coral crack",
    hp: 48,
    revealId: "skills",
    entrance: "The plaque wants you to bounce. Its first word is Slam.",
    fall: "The blanks fill in. The page is finished telling on you.",
  },
];

const REVEALS = [
  {
    id: "place",
    kicker: "Name & place",
    title: "Justin Nelson Pañe",
    lede: "Cebu City, Central Visayas. The heat is part of the biography. So is the hour it finally lets go — which is when the city is worth walking.",
    facts: [
      { label: "Name", value: "Justin Nelson Pañe" },
      { label: "Home", value: "Cebu City" },
      { label: "Region", value: "Central Visayas, PH" },
    ],
  },
  {
    id: "portrait",
    kicker: "Portrait",
    title: "The real face",
    lede: "A photo, not a painting. Same person the guardians were sitting on. The rest of the page is ink and gold; this one is the camera.",
    portrait: true,
  },
  {
    id: "life",
    kicker: "Hobbies & interests",
    title: "What gets the free hours",
    lede: "These are the hours that are actually mine.",
    items: [
      { tag: "Hobby", title: "Video games", detail: "Where the free time goes. A fight you can read before you commit is the kind I come back to." },
      { tag: "Hobby", title: "Creating websites", detail: "HTML, CSS, and JavaScript, put together until the page does something. This one is the current example." },
      { tag: "Hobby", title: "Reading IT updates", detail: "New tools, patches, and what changed in the field before it shows up in class." },
      { tag: "Interest", title: "Developing games", detail: "Not only playing them. Learning how a turn, a telegraph, and a reward are built." },
      { tag: "Interest", title: "Good food", detail: "A better meal is worth the trip. Cebu makes that an easy interest to keep." },
    ],
  },
  {
    id: "skills",
    kicker: "Skills",
    title: "What I can defend out loud",
    lede: "Four things I can stand behind when someone asks what I actually do.",
    items: [
      { title: "Programming", detail: "Writing the page, not only describing it. HTML, CSS, and JavaScript that answer when you touch them." },
      { title: "Leadership", detail: "Keeping a group pointed at the same job, and saying the next step out loud." },
      { title: "Problem-solving", detail: "Finding what is actually broken before throwing a fix at it." },
      { title: "Strategic thinker", detail: "Reading the next move before committing. The telegraph on this page is that habit with hit points." },
    ],
  },
];

const CODA =
  "Nothing here disabled the tab or parked you on a loading veil. The clock only records whether the page was worth a fraction of a minute. If you are reading this, the guardians lost.";

const BASE_HP = 34;
const app = document.querySelector("#app");

let battle = createBattle();
let elapsed = 0;
let muted = false;
let audioCtx = null;
let master = null;
let theme = null;
let themeArmed = false;

function createBattle() {
  const monster = MONSTERS[0];
  return {
    phase: "player",
    monsterIndex: 0,
    uid: 2,
    player: freshPlayer(0),
    enemy: freshEnemy(monster),
    intent: "slam",
    log: [
      { id: 1, tone: "lore", text: "Four guardians sealed the rest of this page. Your name is already on the door. Strike." },
      { id: 2, tone: "foe", text: monster.entrance },
    ],
    floaters: [],
    reveals: [],
    pendingReveal: null,
    shake: 0,
    flashFoe: 0,
    flashYou: 0,
    sfx: null,
  };
}

function freshPlayer(owned) {
  const maxHp = BASE_HP + (owned >= 1 ? 8 : 0);
  return {
    hp: maxHp,
    maxHp,
    focus: false,
    guard: "none",
    strikeBonus: owned >= 2 ? 2 : 0,
    guardHeal: 4 + (owned >= 3 ? 3 : 0),
  };
}

function freshEnemy(monster) {
  return { hp: monster.hp, maxHp: monster.hp, exposed: false, braced: false };
}

function perkLine(owned) {
  if (owned === 1) return "Next guardian: you enter with +8 life.";
  if (owned === 2) return "Next guardian: your strikes hit 2 harder.";
  if (owned === 3) return "Next guardian: Guard mends more.";
  return "The page opens.";
}

function strikeRange() {
  let min = 7 + battle.player.strikeBonus;
  let max = 10 + battle.player.strikeBonus;
  if (battle.player.focus) {
    min += 8;
    max += 8;
  }
  if (battle.enemy.braced) {
    min = Math.max(2, min - 4);
    max = Math.max(2, max - 4);
  }
  if (battle.enemy.exposed) {
    min = Math.round(min * 1.25);
    max = Math.round(max * 1.25);
  }
  return min === max ? String(min) : min + "–" + max;
}

function push(tone, text) {
  battle.log = battle.log.concat({ id: ++battle.uid, tone, text }).slice(-5);
}

function harmEnemy(damage, line) {
  battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);
  battle.floaters.push({ id: ++battle.uid, who: "foe", tone: "hurt", text: "−" + damage });
  battle.flashFoe += 1;
  battle.shake += 1;
  battle.sfx = "strike";
  push("you", line + " " + damage + ".");
}

/* Player chooses. Then, if the monster lives, the enemy answers. */
function act(action) {
  if (battle.phase !== "player") return;
  battle.floaters = [];
  battle.sfx = action === "expose" ? "expose" : action;

  if (action === "guard") {
    battle.player.guard = "full";
    const heal = Math.min(battle.player.guardHeal, battle.player.maxHp - battle.player.hp);
    battle.player.hp += heal;
    if (heal > 0) {
      battle.floaters.push({ id: ++battle.uid, who: "you", tone: "heal", text: "+" + heal });
    }
    battle.sfx = "guard";
    push("you", heal > 0 ? "You brace and mend " + heal + "." : "You brace. Already full.");
  } else if (action === "focus") {
    if (battle.player.focus) push("you", "Already coiled. The charge holds.");
    else {
      battle.player.focus = true;
      push("you", "You coil a heavier strike.");
    }
  } else if (action === "expose") {
    const already = battle.enemy.exposed;
    battle.enemy.exposed = true;
    harmEnemy(already ? 8 : 5, already ? "You press the open seam." : "You find the seam.");
    battle.sfx = "expose";
  } else {
    let damage = 7 + Math.floor(Math.random() * 4) + battle.player.strikeBonus;
    const charged = battle.player.focus;
    if (charged) damage += 8;
    battle.player.focus = false;
    if (battle.enemy.braced) {
      damage = Math.max(2, damage - 4);
      battle.enemy.braced = false;
    }
    if (battle.enemy.exposed) damage = Math.round(damage * 1.25);
    harmEnemy(damage, charged ? "The charge breaks through." : "You strike.");
  }

  const monster = MONSTERS[battle.monsterIndex];
  if (battle.enemy.hp <= 0) {
    battle.enemy.hp = 0;
    battle.phase = "reveal";
    battle.pendingReveal = monster.revealId;
    battle.shake += 1;
    battle.sfx = "win";
    push("lore", monster.fall);
    return;
  }
  battle.phase = "enemy";
}

function enemyAct() {
  if (battle.phase !== "enemy") return;
  battle.floaters = [];
  const intent = battle.intent;

  if (intent === "brace") {
    const heal = Math.min(6, battle.enemy.maxHp - battle.enemy.hp);
    battle.enemy.hp += heal;
    battle.enemy.braced = true;
    battle.sfx = "heal";
    if (heal > 0) battle.floaters.push({ id: ++battle.uid, who: "foe", tone: "heal", text: "+" + heal });
    push("foe", heal > 0 ? "It braces, mends " + heal + ", and hardens. Your next Strike will glance." : "It hardens. Your next Strike will glance.");
  } else {
    const raw = intent === "slam" ? 8 + Math.floor(Math.random() * 3) : 5 + Math.floor(Math.random() * 3);
    let dealt = raw;
    if (battle.player.guard === "full") dealt = Math.max(1, Math.round(raw * (intent === "rake" ? 0.72 : 0.4)));
    battle.player.guard = "none";
    battle.player.hp = Math.max(0, battle.player.hp - dealt);
    battle.floaters.push({ id: ++battle.uid, who: "you", tone: "hurt", text: "−" + dealt });
    battle.flashYou += 1;
    battle.shake += 1;
    battle.sfx = "hurt";
    push("foe", (intent === "slam" ? "Slam" : "Rake") + " connects for " + dealt + ".");
  }

  if (battle.player.hp <= 0) {
    battle.player.hp = 0;
    battle.phase = "down";
    battle.sfx = "down";
    push("lore", "You drop. The lines you already won stay written.");
    return;
  }

  const ratio = battle.enemy.hp / battle.enemy.maxHp;
  let next = ratio <= 0.34 && battle.intent !== "brace" ? "brace" : ["slam", "slam", "rake", "brace"][Math.floor(Math.random() * 4)];
  if (next === battle.intent) next = next === "slam" ? "rake" : "slam";
  battle.intent = next;
  battle.phase = "player";
}

function acknowledge() {
  if (battle.phase !== "reveal" || !battle.pendingReveal) return;
  if (!battle.reveals.includes(battle.pendingReveal)) battle.reveals.push(battle.pendingReveal);
  battle.pendingReveal = null;
  battle.floaters = [];
  const next = battle.monsterIndex + 1;
  if (next >= MONSTERS.length) {
    battle.phase = "cleared";
    battle.sfx = "win";
    push("lore", "The page is open.");
    return;
  }
  battle.sfx = "tick";
  battle.monsterIndex = next;
  battle.phase = "player";
  battle.player = freshPlayer(battle.reveals.length);
  battle.enemy = freshEnemy(MONSTERS[next]);
  battle.intent = "slam";
  push("lore", MONSTERS[next].entrance);
}

function standUp() {
  if (battle.phase !== "down") return;
  const monster = MONSTERS[battle.monsterIndex];
  battle.phase = "player";
  battle.sfx = "heal";
  battle.floaters = [];
  battle.player.hp = battle.player.maxHp;
  battle.player.focus = false;
  battle.player.guard = "none";
  battle.enemy = freshEnemy(monster);
  battle.intent = "slam";
  push("lore", "It reforms. What you already pried loose does not.");
}

function revealById(id) {
  return REVEALS.find(function (item) { return item.id === id; });
}

function esc(value) {
  return String(value)
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function bar(label, hp, max, foe) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return (
    '<div class="hp-label"><span>' + esc(label) + "</span><span>" + hp + "/" + max + "</span></div>" +
    '<div class="track life' + (foe ? " foe" : "") + '" role="meter" aria-label="' + esc(label) + '" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + hp + '"><span style="width:' + pct + '%"></span></div>'
  );
}

function portrait(src, alt, flash, who, sealed) {
  const notes = battle.floaters
    .filter(function (item) { return item.who === who; })
    .map(function (item) {
      return '<b class="floater ' + item.tone + '">' + esc(item.text) + "</b>";
    })
    .join("");
  const face = sealed
    ? '<div class="mystery" role="img" aria-label="' + esc(alt) + '">?</div>'
    : '<img src="' + src + '" alt="' + esc(alt) + '">';
  return (
    '<div class="portrait' + (who === "you" ? " small" : "") + (flash > 0 ? " hit" : "") + '">' +
    face + notes + "</div>"
  );
}

function revealBody(reveal) {
  let html = '<p class="kicker">' + esc(reveal.kicker) + "</p><h3>" + esc(reveal.title) + "</h3>";
  if (reveal.portrait) {
    html += '<img src="art/justin.png" alt="Photo of Justin Nelson Pañe" style="width:100%;max-width:14rem;aspect-ratio:1;object-fit:cover;border-radius:0.8rem;margin-top:0.6rem">';
  }
  html += "<p>" + esc(reveal.lede) + "</p>";
  if (reveal.facts) {
    html += '<dl class="facts">' + reveal.facts.map(function (fact) {
      return "<div><dt class=\"tiny\">" + esc(fact.label) + "</dt><dd>" + esc(fact.value) + "</dd></div>";
    }).join("") + "</dl>";
  }
  if (reveal.items) {
    html += "<ul>" + reveal.items.map(function (item) {
      return "<li><strong>" + (item.tag ? esc(item.tag) + " · " : "") + esc(item.title) + "</strong><br><span class=\"small\">" + esc(item.detail) + "</span></li>";
    }).join("") + "</ul>";
  }
  return html;
}

function renderBattle() {
  const monster = MONSTERS[battle.monsterIndex];
  const intent = INTENTS[battle.intent];
  const busy = battle.phase !== "player";
  const pending = battle.pendingReveal ? revealById(battle.pendingReveal) : null;
  const earned = function (id) {
    return battle.reveals.includes(id) || battle.pendingReveal === id;
  };
  const earnedCount = REVEALS.filter(function (item) { return earned(item.id); }).length;

  const pips = MONSTERS.map(function (entry) {
    const cls = earned(entry.revealId) ? "on" : entry.id === monster.id ? "now" : "";
    return "<i class=\"" + cls + "\"></i>";
  }).join("");

  const tags = [
    battle.enemy.exposed ? '<span class="tag coral">Seam open · strikes +25%</span>' : "",
    battle.enemy.braced ? '<span class="tag gold">Hardened · next Strike glances</span>' : "",
  ].join("");
  const youTags = [
    battle.player.focus ? '<span class="tag gold">Charged</span>' : "",
    battle.player.guard === "full" ? '<span class="tag">Guard up</span>' : "",
    battle.player.strikeBonus > 0 ? '<span class="tag">Strikes +' + battle.player.strikeBonus + "</span>" : "",
  ].join("");

  const cards = REVEALS.map(function (reveal) {
    const open = earned(reveal.id);
    if (!open) {
      const owner = MONSTERS.find(function (entry) { return entry.revealId === reveal.id; });
      return '<article class="card locked"><p class="tiny">' + esc(reveal.kicker) + '</p><p>Still sealed.</p><p class="small">Drops from ' + esc(owner.name) + ".</p></article>";
    }
    return '<article class="paper card">' + revealBody(reveal) + "</article>";
  }).join("");

  let veil = "";
  if (battle.phase === "reveal" && pending) {
    const last = battle.monsterIndex === MONSTERS.length - 1;
    veil =
      '<div class="veil"><div class="paper"><p class="kicker">Recovered</p>' +
      revealBody(pending) +
      "<p>" + esc(perkLine(battle.reveals.length + 1)) + "</p>" +
      '<button type="button" data-action="' + (last ? "finish" : "next") + '">' +
      (last ? "Open the page" : "Take it. Next guardian.") +
      "</button></div></div>";
  } else if (battle.phase === "down") {
    veil =
      '<div class="veil"><div class="paper down-box"><h3>Down, not erased.</h3><p>' +
      esc(monster.name) +
      " reforms. Every fact you already won is still in the dossier.</p>" +
      '<button type="button" data-action="standup">Stand up</button></div></div>';
  }

  app.innerHTML =
    '<div class="wrap' + (battle.shake ? " shake" : "") + '">' +
    header() +
    '<div class="layout"><section class="arena" aria-label="Battle">' +
    '<div class="spread bar-row pad"><p class="small muted">Guardian ' + (battle.monsterIndex + 1) + " of " + MONSTERS.length + '</p><div class="pips" aria-hidden="true">' + pips + "</div></div>" +
    '<div class="row">' + portrait(monster.art, monster.alt, battle.flashFoe, "foe") +
    '<div class="grow"><h2>' + esc(monster.name) + '</h2><p class="small muted">' + esc(monster.epithet) + "</p>" +
    bar(monster.name + " life", battle.enemy.hp, battle.enemy.maxHp, true) +
    '<div class="tags">' + tags + "</div></div></div>" +
    '<div class="telegraph ' + battle.intent + '"><p class="tiny">Telegraph — their next move</p><h3>' +
    intent.name + ' <span class="gold">· ' + intent.range + "</span></h3><p class=\"small muted\">" + esc(intent.hint) + "</p></div>" +
    '<div class="row">' + portrait("art/justin.png", earned("portrait") ? "Photo of Justin Nelson Pañe" : "Photo still hidden", battle.flashYou, "you", !earned("portrait")) +
    '<div class="grow"><p class="tiny">You fight as</p><p class="display">' + esc(PERSON.name) + "</p>" +
    bar("Your life", battle.player.hp, battle.player.maxHp, false) +
    '<div class="tags">' + youTags + "</div></div></div>" +
    '<ul class="log" aria-live="polite">' + battle.log.slice(-2).map(function (line) {
      return '<li class="' + line.tone + '">' + esc(line.text) + "</li>";
    }).join("") + "</ul>" +
    '<div class="actions">' +
    button("strike", "Strike", battle.player.focus ? "Charged · " + strikeRange() : strikeRange(), "1", busy, true) +
    button("guard", "Guard", battle.intent === "slam" ? "Best now · mend " + battle.player.guardHeal : "Mend " + battle.player.guardHeal, "2", busy, false) +
    button("focus", "Focus", battle.player.focus ? "Already charged" : "Next Strike +8", "3", busy, false) +
    button("expose", "Expose", battle.enemy.exposed ? "Press the seam · 8" : "Open a seam · 5", "4", busy, false) +
    "</div>" +
    (battle.phase === "enemy" ? '<p class="small muted" style="padding:0 1rem 1rem">Their turn — watch the hit land.</p>' : "") +
    veil +
    '</section><aside class="side" aria-label="Dossier"><div class="spread"><h2>What the fight gave up</h2><p class="muted">' +
    earnedCount + "/" + REVEALS.length + "</p></div>" + cards + "</aside></div></div>";
}

function button(action, label, hint, key, disabled, primary) {
  return (
    '<button type="button" data-action="' + action + '"' + (disabled ? " disabled" : "") + (primary ? ' class="primary"' : "") + ">" +
    "<strong>" + label + "<kbd>" + key + "</kbd></strong><span>" + esc(hint) + "</span></button>"
  );
}

function header() {
  const stayed = elapsed >= 45;
  const width = Math.min(100, (Math.min(elapsed, 45) / 45) * 100);
  return (
    '<header class="top"><div class="kicker-row"><p class="kicker">Personal dossier</p><div class="kicker-row">' +
    '<div class="clock"><p class="tiny">Visitor clock</p><div class="track" aria-hidden="true"><span data-clock-bar style="width:' + width + '%"></span></div>' +
    '<p data-clock>' + (stayed ? "You stayed." : elapsed + "s of 45") + "</p></div>" +
    '<button type="button" class="icon-btn" data-action="mute" aria-pressed="' + muted + '">' + (muted ? "Off" : "Snd") + "</button>" +
    "</div></div><h1>" + esc(PERSON.name) + "</h1>" +
    '<p class="lede">Beat a guardian. It gives up a piece of you. The clock never locks the page.</p></header>'
  );
}

function renderOpen() {
  const place = REVEALS[0];
  const life = REVEALS[2];
  const skills = REVEALS[3];
  app.innerHTML =
    '<main class="wrap open"><p class="kicker" data-open-clock>Dossier open' + (elapsed >= 45 ? " · you stayed" : " · " + elapsed + "s") + "</p>" +
    '<div class="open-hero"><img src="art/justin.png" alt="Photo of Justin Nelson Pañe">' +
    "<div><h1>" + esc(PERSON.name) + '</h1><p class="muted">' + esc(PERSON.city) + ", " + esc(PERSON.region) + "</p><p>" + esc(PERSON.line) + "</p></div></div>" +
    '<section class="place"><p class="kicker">' + esc(place.kicker) + "</p><p>" + esc(place.lede) + "</p>" +
    '<dl class="facts">' + place.facts.map(function (fact) {
      return '<div class="fact"><dt class="tiny">' + esc(fact.label) + "</dt><dd>" + esc(fact.value) + "</dd></div>";
    }).join("") + "</dl></section>" +
    '<section class="place"><p class="kicker">' + esc(life.kicker) + "</p><h2>" + esc(life.title) + '</h2><p class="muted">' + esc(life.lede) + "</p>" +
    life.items.map(function (item) {
      return '<article class="card item"><p class="tiny">' + esc(item.tag) + "</p><h3>" + esc(item.title) + '</h3><p class="small muted">' + esc(item.detail) + "</p></article>";
    }).join("") + "</section>" +
    '<section class="place"><p class="kicker">' + esc(skills.kicker) + "</p><h2>" + esc(skills.title) + '</h2><p class="muted">' + esc(skills.lede) + "</p>" +
    skills.items.map(function (item) {
      return '<article class="card item"><h3>' + esc(item.title) + '</h3><p class="small muted">' + esc(item.detail) + "</p></article>";
    }).join("") + "</section>" +
    '<p class="coda">' + esc(CODA) + "</p>" +
    '<button type="button" class="replay slim" data-action="replay">Fight the guardians again</button></main>';
}

function render() {
  if (battle.phase === "cleared") renderOpen();
  else renderBattle();
}

function afterAction(already) {
  if (battle.sfx && battle.sfx !== already) play(battle.sfx);
  render();
  if (battle.phase === "enemy") {
    window.setTimeout(function () {
      if (battle.phase !== "enemy") return;
      enemyAct();
      play(battle.sfx);
      render();
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 180 : 680);
  }
}

function onAction(action) {
  unlockAudio();
  if (action === "mute") {
    muted = !muted;
    if (master && audioCtx) master.gain.setTargetAtTime(muted ? 0 : 0.7, audioCtx.currentTime, 0.02);
    if (theme) {
      theme.muted = muted;
      if (muted) theme.pause();
      else theme.play().catch(function () {});
    }
    render();
    return;
  }
  if (action === "next" || action === "finish") {
    acknowledge();
    afterAction();
    return;
  }
  if (action === "standup") {
    standUp();
    afterAction();
    return;
  }
  if (action === "replay") {
    battle = createBattle();
    render();
    return;
  }
  play(action);
  act(action);
  afterAction(action);
}

/* The track starts as soon as the browser allows it, then loops.
   A first tap starts it if autoplay was blocked. Mute pauses it. */
function startTheme() {
  if (!theme) {
    theme = new Audio("theme.mp3");
    theme.loop = true;
    theme.preload = "auto";
    theme.volume = 0.38;
  }
  theme.muted = muted;
  if (muted) {
    theme.pause();
    return;
  }
  theme.play().catch(function () {
    if (themeArmed) return;
    themeArmed = true;
    const kick = function () {
      themeArmed = false;
      if (!muted && theme) theme.play().catch(function () {});
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
  });
}

function unlockAudio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (Ctor) {
    if (!audioCtx) {
      audioCtx = new Ctor();
      master = audioCtx.createGain();
      master.gain.value = muted ? 0 : 0.7;
      master.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }
  startTheme();
}

function tone(delay, freq, dur, type, gain, slide) {
  if (!audioCtx || !master || muted) return;
  const t = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(48, slide), t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp);
  amp.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

function play(kind) {
  if (!kind) return;
  if (kind === "strike") {
    tone(0, 210, 0.09, "square", 0.42, 70);
    tone(0.02, 90, 0.16, "sawtooth", 0.28, 48);
  } else if (kind === "guard") {
    tone(0, 160, 0.12, "triangle", 0.4);
    tone(0.06, 240, 0.18, "sine", 0.28);
    tone(0.12, 480, 0.14, "sine", 0.16);
  } else if (kind === "focus") {
    tone(0, 280, 0.1, "sine", 0.22, 520);
    tone(0.1, 440, 0.16, "triangle", 0.28, 760);
  } else if (kind === "expose") {
    tone(0, 920, 0.07, "square", 0.28);
    tone(0.06, 1380, 0.12, "triangle", 0.24);
  } else if (kind === "hurt") tone(0, 96, 0.16, "sawtooth", 0.3, 48);
  else if (kind === "tick") tone(0, 740, 0.06, "square", 0.16);
  else if (kind === "heal") tone(0, 520, 0.14, "sine", 0.22, 780);
  else if (kind === "win") {
    tone(0, 392, 0.16, "triangle", 0.28);
    tone(0.09, 523, 0.16, "triangle", 0.28);
    tone(0.18, 659, 0.24, "triangle", 0.32);
  } else if (kind === "down") tone(0, 180, 0.3, "sine", 0.28, 62);
}

document.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  onAction(button.dataset.action);
});

document.addEventListener("keydown", function (event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const keys = { 1: "strike", 2: "guard", 3: "focus", 4: "expose" };
  const action = keys[event.key];
  if (!action) return;
  event.preventDefault();
  onAction(action);
});

window.setInterval(function () {
  elapsed += 1;
  const stayed = elapsed >= 45;
  const label = document.querySelector("[data-clock]");
  const bar = document.querySelector("[data-clock-bar]");
  if (label) label.textContent = stayed ? "You stayed." : elapsed + "s of 45";
  if (bar) bar.style.width = Math.min(100, (Math.min(elapsed, 45) / 45) * 100) + "%";
  const openLine = document.querySelector("[data-open-clock]");
  if (openLine) openLine.textContent = "Dossier open" + (stayed ? " · you stayed" : " · " + elapsed + "s");
}, 1000);

render();
startTheme();
