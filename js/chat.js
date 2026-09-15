/* Pronto Assistant
   Answers only from Pronto Automotive's own published information.
   No network calls: every reply is written here, so it never invents details. */
(function () {
  "use strict";

  var ROOT = document.documentElement.getAttribute("data-root") || "";
  var PHONE = '<a href="tel:+19052949476">905-294-9476</a>';
  var TOLL = '<a href="tel:+18774776686">1-877-477-6686</a>';
  var EMAIL = '<a href="mailto:info@prontomarkham.com">info@prontomarkham.com</a>';
  var MAPS = "https://www.google.com/maps/search/?api=1&query=5833+Highway+7+East+Markham+Ontario";

  function page(slug, label) {
    return '<a href="' + ROOT + "services/" + slug + '.html">' + label + "</a>";
  }

  var BOOK = { label: "Book service", action: "book" };
  var CALL = { label: "Call the shop", href: "tel:+19052949476" };
  var DIRECTIONS = { label: "Get directions", href: MAPS };
  var FLEET = { label: "Fleet service", href: ROOT + "fleet.html" };

  // Order matters only for ties: more specific topics come first.
  var TOPICS = [
    { keys: ["check engine", "engine light", "warning light", "diagnos", "scan", "code", "obd"],
      reply: "Warning light on? Our technicians trace the cause properly so the right repair happens the first time. " + page("diagnostics", "More about diagnostics"),
      actions: [BOOK] },
    { keys: ["brake", "pad", "rotor", "squeal", "grind", "abs"],
      reply: "Squealing, grinding or a soft pedal? We inspect pads, rotors, calipers and brake fluid, and replace only what's needed. " + page("brakes", "More about brakes"),
      actions: [BOOK] },
    { keys: ["oil", "maintenance", "filter", "lube", "tune", "fluid", "flush"],
      reply: "We handle lube, oil and filter service, tune-ups, fluid flushes and scheduled maintenance for gas and diesel vehicles. " + page("oil-maintenance", "More about maintenance"),
      actions: [BOOK] },
    { keys: ["tire", "tyre", "flat", "winter", "seasonal", "balanc"],
      reply: "We supply, install and balance tires, and handle seasonal changeovers. " + page("tires", "More about tires"),
      actions: [BOOK] },
    { keys: ["steer", "suspension", "alignment", "shock", "strut", "pulls", "pulling", "vibrat", "bumpy"],
      reply: "Pulling, wandering or a rough ride? We service shocks, struts, steering parts and wheel alignment. " + page("steering-suspension", "More about steering &amp; suspension"),
      actions: [BOOK] },
    { keys: ["engine", "overheat", "leak", "misfire", "coolant", "radiator", "belt", "hose", "timing"],
      reply: "Whether you need an oil change or an engine change, we work on gas and diesel engines from light to heavy duty. " + page("engine-repair", "More about engine repair"),
      actions: [BOOK] },
    { keys: ["fleet", "commercial", "business", "company vehicle", "trailer", "trucks"],
      reply: "We look after fleets large and small &mdash; cars, trucks and trailers &mdash; with maintenance programs built around your schedule and budget, plus free pick-up and delivery for most vehicles and equipment.",
      actions: [FLEET, CALL] },
    { keys: ["hour", "open", "close", "saturday", "sunday", "weekend", "today"],
      reply: "We're open <strong>Monday&ndash;Friday, 8 AM&ndash;6 PM</strong> and <strong>Saturday, 8 AM&ndash;1 PM</strong> (Eastern Time).",
      actions: [BOOK, CALL] },
    { keys: ["where", "address", "location", "direction", "map", "find you", "highway", "hwy"],
      reply: "You'll find us at <strong>5833 Highway 7 East, Markham, Ontario</strong>.",
      actions: [DIRECTIONS, CALL] },
    { keys: ["phone", "call", "number", "contact", "fax", "toll", "email", "reach"],
      reply: "Call " + PHONE + " (toll-free " + TOLL + "), email " + EMAIL + ", or fax (905) 294-3383.",
      actions: [CALL] },
    { keys: ["book", "appointment", "schedule", "reserve", "drop off", "bring my", "bring in"],
      reply: "Tap <strong>Book service</strong> to send a request with your vehicle and preferred date. It isn't confirmed until a member of the Pronto team contacts you. Prefer to talk? Call " + PHONE + ".",
      actions: [BOOK, CALL] },
    { keys: ["price", "cost", "cheap", "how much", "expensive", "rate", "charge", "quote", "estimate"],
      reply: "Every vehicle is different, so we don't quote prices online. We'll inspect it, explain what we find and walk you through your options before any work begins. We're not trying to be the cheapest shop in town &mdash; we're here to be the one you can trust.",
      actions: [BOOK, CALL] },
    { keys: ["warranty", "guarantee", "stand behind", "not right", "went wrong", "come back", "problem after"],
      reply: "If something isn't right, we work with you to make it right. We stand behind our work and beside our customers &mdash; just call " + PHONE + ".",
      actions: [CALL] },
    { keys: ["air condition", "a/c", "transmission", "differential", "transfer case", "power steering", "fuel", "glass", "windshield", "hitch", "towing", "inspection", "safety", "exhaust", "muffler", "emission", "used car", "car sales", "buy a car", "services", "what do you", "offer"],
      reply: "Along with brakes, tires, diagnostics and engine work, we offer air conditioning, coolant flush, transmission, transfer case and differential service, wheel alignment, belts and hoses, brake and power steering flushes, fuel system and intake cleaning, tune-ups, windshield and glass replacement, trailer hitches, towing and accessories, exhaust and mufflers, emissions testing, safety inspections, and used car purchase and sales.",
      actions: [BOOK] },
    { keys: ["diesel", "heavy", "gasoline", "make", "model", "kind of car", "what cars", "vehicles"],
      reply: "We diagnose and repair all gasoline and diesel vehicles, from light duty to heavy duty.",
      actions: [BOOK] },
    { keys: ["pay", "credit", "card", "debit", "visa", "mastercard"],
      reply: "We accept Visa, Mastercard, American Express and Discover. Fleet customers can also use fleet programs such as PHH Fleet Management and Foss National Leasing.",
      actions: [FLEET] },
    { keys: ["pick up", "pickup", "pick-up", "delivery", "tow", "shuttle", "ride"],
      reply: "Free pick-up and delivery is available for most fleet vehicles and equipment. For a personal vehicle, call " + PHONE + " and we'll let you know what we can arrange.",
      actions: [CALL] },
    { keys: ["since", "how long", "history", "about", "owner", "who are"],
      reply: "Pronto Automotive has served Markham and the surrounding area since 1979. The customer always comes first &mdash; we stand behind our work and beside the people we serve.",
      actions: [BOOK] },
    { keys: ["thank", "thx", "cheers"],
      reply: "You're welcome! If you need anything else, we're at " + PHONE + ".",
      actions: [] },
    { keys: ["hi", "hello", "hey", "good morning", "good afternoon"],
      reply: "Hi there! Ask me about our hours, services, fleet programs or booking.",
      actions: [] }
  ];

  var FALLBACK = {
    reply: "I'm not sure about that one. I can help with hours, services, fleet programs, booking and directions &mdash; or call " + PHONE + " or email " + EMAIL + " and the team will help.",
    actions: [CALL, BOOK]
  };

  // A key matches only at the start of a word, so "hi" never matches "this".
  function hasKey(text, key) {
    var i = text.indexOf(key);
    while (i !== -1) {
      if (!/[a-z0-9]/.test(text.charAt(i - 1))) return true;
      i = text.indexOf(key, i + 1);
    }
    return false;
  }

  function findTopic(text) {
    var q = " " + text.toLowerCase() + " ";
    var best = null, bestScore = 0;
    TOPICS.forEach(function (topic) {
      var score = 0;
      topic.keys.forEach(function (key) {
        if (hasKey(q, key)) score += key.indexOf(" ") !== -1 ? 2 : 1;
      });
      if (score > bestScore) { best = topic; bestScore = score; }
    });
    return best || FALLBACK;
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var launcher = el("button", "chat-launcher", ICON_CHAT + "<span>Ask Pronto</span>");
  launcher.type = "button";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "chatPanel");

  var panel = el("section", "chat-panel",
    '<header class="chat-head"><div><strong>Pronto Assistant</strong><span>Hours, services, fleet and booking</span></div>' +
    '<button type="button" class="chat-close" aria-label="Close chat">&times;</button></header>' +
    '<div class="chat-log" role="log" aria-live="polite"></div>' +
    '<div class="chat-chips" aria-label="Suggested questions"></div>' +
    '<form class="chat-form"><label class="sr-only" for="chatInput">Ask a question</label>' +
    '<input id="chatInput" type="text" autocomplete="off" maxlength="200" placeholder="Ask about hours, brakes, fleet...">' +
    '<button type="submit" aria-label="Send">' + ICON_SEND + "</button></form>");
  panel.id = "chatPanel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Pronto Automotive assistant");

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  var log = panel.querySelector(".chat-log");
  var input = panel.querySelector("#chatInput");
  var chips = panel.querySelector(".chat-chips");
  var greeted = false;

  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addUser(text) {
    var msg = el("div", "chat-msg chat-user");
    var p = document.createElement("p");
    p.textContent = text; // user text is never parsed as HTML
    msg.appendChild(p);
    log.appendChild(msg);
    scrollDown();
  }

  function addBot(topic) {
    var msg = el("div", "chat-msg chat-bot");
    msg.appendChild(el("p", null, topic.reply));
    if (topic.actions && topic.actions.length) {
      var row = el("div", "chat-actions");
      topic.actions.forEach(function (a) {
        var btn;
        if (a.href) {
          btn = el("a", "chat-action", a.label);
          btn.href = a.href;
          if (a.href.indexOf("http") === 0) { btn.target = "_blank"; btn.rel = "noopener noreferrer"; }
        } else {
          btn = el("button", "chat-action", a.label);
          btn.type = "button";
          btn.addEventListener("click", function () { runAction(a.action); });
        }
        row.appendChild(btn);
      });
      msg.appendChild(row);
    }
    log.appendChild(msg);
    scrollDown();
  }

  function ask(text) {
    text = text.trim();
    if (!text) return;
    addUser(text);
    setTimeout(function () { addBot(findTopic(text)); }, 280);
  }

  function runAction(action) {
    if (action !== "book") return;
    closeChat();
    var trigger = document.querySelector("[data-book]");
    if (trigger) trigger.click();
    else window.location.href = ROOT + "index.html#contact";
  }

  ["Hours", "Book service", "Brakes", "Fleet service", "Directions"].forEach(function (label) {
    var chip = el("button", null, label);
    chip.type = "button";
    chip.addEventListener("click", function () { ask(label); });
    chips.appendChild(chip);
  });

  function openChat() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      addBot({
        reply: "Hi! I'm Pronto's assistant. Ask about our hours, services, fleet programs or booking. For anything urgent, call " + PHONE + ".",
        actions: []
      });
    }
    setTimeout(function () { input.focus(); }, 50);
  }

  function closeChat() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", openChat);
  panel.querySelector(".chat-close").addEventListener("click", closeChat);
  panel.querySelector(".chat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
    input.value = "";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) closeChat();
  });
})();
