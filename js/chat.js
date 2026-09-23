/* Pronto Assistant
   Answers only from Pronto Automotive's own published information (the pages on this site).
   Every reply is written here, so it never invents details. The only network call is a
   booking request, sent through the same FormSubmit inboxes as the booking form. */
(function () {
  "use strict";

  var ROOT = document.documentElement.getAttribute("data-root") || "";
  var PHONE = '<a href="tel:+19052949476">905-294-9476</a>';
  var EMAIL = '<a href="mailto:info@prontomarkham.com">info@prontomarkham.com</a>';
  var MAPS = "https://www.google.com/maps/search/?api=1&query=5833+Highway+7+East+Markham+Ontario";

  function link(path, label) { return '<a href="' + ROOT + path + '">' + label + "</a>"; }
  function svc(slug, label) { return link("services/" + slug + ".html", label); }

  var BOOK = { label: "Book in chat", action: "book" };
  var CALL = { label: "Call the shop", href: "tel:+19052949476" };
  var DIRECTIONS = { label: "Get directions", href: MAPS };
  var FLEET = { label: "Fleet service", href: ROOT + "fleet.html" };
  var SERVICES = { label: "All services", href: ROOT + "services.html" };
  var FAQ = { label: "FAQ", href: ROOT + "faq.html" };

  /* ---------- Live open / closed status (shop runs on Eastern Time) ---------- */
  function shopStatus() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Toronto", weekday: "short", hour: "numeric", minute: "numeric", hour12: false })
        .formatToParts(new Date());
      var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      var mins = (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10);
      var close = day >= 1 && day <= 5 ? 17 * 60 : day === 6 ? 12 * 60 : 0;
      if (close && mins >= 8 * 60 && mins < close) return " We're <strong>open right now</strong> until " + (close === 720 ? "12 PM" : "5 PM") + ".";
      return " We're <strong>closed right now</strong>, but you can still send a booking request here.";
    } catch (e) { return ""; }
  }

  /* ---------- Knowledge base, written from the site's pages ----------
     keys: phrases matched at the start of a word (typos within 1 letter are forgiven).
     service: the booking-form service this topic books, so "book my brakes" skips a step.
     weight: < 1 for broad topics ("repair", "call") so a specific topic wins a tie. */
  var TOPICS = [
    { id: "flashing", weight: 5, keys: ["flashing", "blinking", "flashing light", "engine light flashing"],
      reply: "A <strong>flashing</strong> check engine light usually means a serious misfire. Avoid driving if you can and call us at " + PHONE + " so we can advise you before you bring it in.",
      actions: [CALL, BOOK], service: "Diagnostics" },
    { id: "diagnostics", keys: ["check engine", "engine light", "warning light", "diagnos", "scan", "code", "obd", "dashboard light", "stalling", "stalls", "hesitat", "rough idle", "running rough"],
      reply: "Warning light on or running rough? We read the fault codes and test the system to find the real cause, so the right repair happens the first time. " + svc("diagnostics", "More about diagnostics"),
      actions: [BOOK], service: "Diagnostics" },
    { id: "brakes", keys: ["brake", "pad", "rotor", "caliper", "squeal", "grind", "abs", "spongy", "soft pedal", "stopping"],
      reply: "Squealing, grinding or a soft pedal? We inspect pads, rotors, calipers and brake fluid, and replace only what actually needs replacing. " + svc("brakes", "More about brakes"),
      actions: [BOOK], service: "Brakes" },
    { id: "oil", keys: ["oil", "maintenance", "filter", "lube", "tune up", "tune-up", "tuneup", "fluid", "flush", "service reminder", "coolant flush", "scheduled"],
      reply: "We do lube, oil and filter service, tune-ups, coolant, brake and power steering flushes, and scheduled maintenance for gas and diesel vehicles. How often depends on your vehicle and driving; your dash reminder or owner's manual is the best guide, and we're happy to recommend a schedule. " + svc("oil-maintenance", "More about maintenance"),
      actions: [BOOK], service: "Oil & Maintenance" },
    { id: "tires", keys: ["tire", "tyre", "flat", "winter tire", "snow tire", "seasonal", "changeover", "balanc", "tread", "rim", "wheel"],
      reply: "We supply, install and balance tires, do seasonal changeovers and wheel alignments, for cars, trucks and fleet vehicles. " + svc("tires", "More about tires"),
      actions: [BOOK], service: "Tires" },
    { id: "alignment", keys: ["alignment", "align"],
      reply: "Yes, we do wheel alignments. If the vehicle pulls to one side, the steering wheel is off-centre or tires are wearing unevenly, it's worth a check. " + svc("steering-suspension", "Steering, suspension &amp; alignment"),
      actions: [BOOK], service: "Wheel Alignment" },
    { id: "suspension", keys: ["steer", "suspension", "shock", "strut", "pulls", "pulling", "steering wheel", "vibrat", "bumpy", "clunk", "knock over", "ball joint", "tie rod", "bushing", "wander"],
      reply: "Clunks over bumps, pulling or a bouncy ride? We service shocks, struts, ball joints, tie rods, bushings, steering parts and alignment. " + svc("steering-suspension", "More about steering &amp; suspension"),
      actions: [BOOK], service: "Steering & Suspension" },
    { id: "ac", keys: ["air condition", "a/c", "ac ", "aircon", "air con", "heater", "heating", "no heat", "defrost", "defog", "hvac", "blowing warm", "blowing hot", "climate"],
      reply: "We diagnose and repair A/C and heating: warm A/C, weak airflow, no heat, defrosters that won't clear, leaks and compressors. " + svc("air-conditioning", "More about A/C &amp; heating"),
      actions: [BOOK], service: "Air Conditioning" },
    { id: "transmission", keys: ["transmission", "tranny", "shift", "slipping", "gear", "clutch", "transfer case", "differential", "diff ", "drivetrain", "driveline", "cv axle", "4x4", "awd", "4wd"],
      reply: "We service transmissions, transfer cases and differentials, plus driveline repair like CV axles and U-joints. Harsh or slipping shifts, whining or fluid leaks are worth checking early. " + svc("transmission", "More about transmission &amp; drivetrain"),
      actions: [BOOK], service: "Transmission" },
    { id: "electrical", keys: ["battery", "batteries", "won't start", "wont start", "not starting", "no start", "no-start", "dead", "starter", "alternator", "electrical", "fuse", "wiring", "charging", "jump", "light bulb", "headlight"],
      reply: "Won't start or battery keeps dying? We test the battery, starter and charging system and track down electrical faults, lighting and wiring problems. " + svc("electrical-batteries", "More about electrical &amp; batteries"),
      actions: [BOOK], service: "Electrical & Batteries" },
    { id: "exhaust", keys: ["exhaust", "muffler", "catalytic", "loud", "rattl", "rumbl", "fumes", "tailpipe"],
      reply: "Loud, rattling or smelly exhaust? We repair mufflers, pipes, hangers and gaskets and diagnose catalytic converters on gas and diesel vehicles. " + svc("exhaust", "More about exhaust"),
      actions: [BOOK], service: "Exhaust & Mufflers" },
    { id: "emissions", keys: ["emission", "drive clean", "e-test", "smog"],
      reply: "We offer emission testing and repair emission-related faults. Call " + PHONE + " to check what your vehicle needs.",
      actions: [CALL, BOOK], service: "Diagnostics" },
    { id: "inspection", keys: ["inspection", "inspect", "pre-purchase", "prepurchase", "pre purchase", "buying a car", "buying a used", "used car", "check it over", "road trip", "safety", "certif"],
      reply: "We do pre-purchase inspections (we put the car on a hoist and walk you through brakes, tires, suspension, leaks, rust and warning codes), safety inspections and annual fleet inspections. For a specific certificate, call " + PHONE + " to confirm what you need. " + svc("inspections", "More about inspections"),
      actions: [BOOK], service: "Pre-Purchase Inspection" },
    { id: "engine", keys: ["engine", "overheat", "temperature", "leak", "misfire", "coolant", "radiator", "belt", "hose", "timing", "water pump", "smoke", "head gasket", "power loss", "losing power"],
      reply: "From small leaks and overheating to major mechanical work, we repair gas and diesel engines, light to heavy duty, and explain what's needed before we begin. " + svc("engine-repair", "More about engine repair"),
      actions: [BOOK], service: "Engine Repair" },
    { id: "glass", keys: ["glass", "windshield", "windscreen", "chip", "crack"],
      reply: "Yes, we handle windshield and glass replacement, including on-site glass service for fleets. Call " + PHONE + " for details.",
      actions: [CALL, BOOK] },
    { id: "hitch", keys: ["hitch", "towing package", "trailer hitch", "accessor", "tow bar"],
      reply: "We install trailer hitches, towing equipment and accessories. Call " + PHONE + " to talk about your vehicle.",
      actions: [CALL, BOOK] },
    { id: "sales", keys: ["sell", "do you sell", "cars for sale", "sell my car", "car sales", "buy a car", "for sale", "used car purchase", "sell a car", "trade in", "trade-in"],
      reply: "We do offer used car purchase and sales. Call " + PHONE + " to ask what's available or about selling yours.",
      actions: [CALL] },
    { id: "fleet", keys: ["fleet", "commercial", "business", "company vehicle", "company car", "trailer", "work trucks", "vans", "logistics", "phh", "foss"],
      reply: "We look after fleets large and small, local and nationwide: cars, trucks and trailers, with maintenance programs built around your schedule and budget, documentation for your records, and free pick-up and delivery for most vehicles. Customers include York Regional Police and The Miller Group.",
      actions: [FLEET, BOOK], service: "Fleet Service" },
    { id: "hours", keys: ["hour", "open", "close", "closing", "saturday", "sunday", "weekend", "today", "tomorrow", "holiday", "what time", "when are you"],
      reply: function () { return "We're open <strong>Monday&ndash;Friday, 8 AM&ndash;5 PM</strong> and <strong>Saturday, 8 AM&ndash;12 PM</strong>. Closed Sundays (Eastern Time)." + shopStatus(); },
      actions: [BOOK, CALL] },
    { id: "location", keys: ["where", "address", "location", "located", "direction", "map", "find you", "highway", "hwy", "parking", "how do i get"],
      reply: "We're at <strong>5833 Highway 7 East, Markham, Ontario</strong>. " + link("contact.html", "Map &amp; contact details"),
      actions: [DIRECTIONS, CALL] },
    { id: "areas", keys: ["unionville", "scarborough", "york region", "richmond hill", "stouffville", "pickering", "toronto", "do you serve", "service area", "area", "near me", "close to"],
      reply: "We serve drivers from Markham, Unionville, Scarborough and across York Region, and fleets locally and nationwide. " + link("service-areas.html", "Areas we serve"),
      actions: [DIRECTIONS, BOOK] },
    { id: "contact", keys: ["phone", "call", "number", "contact", "fax", "email", "reach", "talk to", "speak", "human", "person", "someone"],
      reply: "Call " + PHONE + ", email " + EMAIL + ", or fax (905) 294-3383. The team answers during business hours.",
      actions: [CALL] },
    { id: "book", keys: ["book", "appointment", "schedule", "reserve", "drop off", "bring my", "bring in", "bring it", "come in", "availability", "available", "slot"],
      reply: "I can book that for you right here. It takes about a minute.",
      actions: [], startBooking: true },
    { id: "sameday", weight: 0.5, keys: ["same day", "today", "urgent", "emergency", "asap", "right now", "how long", "wait time", "how soon", "turnaround", "while i wait", "wait"],
      reply: "Timing depends on the job and how busy the shop is. For anything urgent, call " + PHONE + " and the team will tell you how soon they can get to it.",
      actions: [CALL, BOOK] },
    { id: "price", keys: ["price", "cost", "cheap", "how much", "expensive", "rate", "quote", "estimate", "fee", "afford"],
      reply: "Every vehicle is different, so we don't quote prices online. We inspect it, explain what we found in plain language and walk you through your options, and nothing proceeds without your approval. We're not trying to be the cheapest shop in town; we're here to be the one you can trust.",
      actions: [BOOK, CALL] },
    { id: "approval", keys: ["without asking", "approve", "approval", "surprise", "upsell", "pressure", "honest", "trust"],
      reply: "Nothing proceeds without your approval. We explain what we find in plain language and you decide. Customers often mention we don't pressure them into extra work.",
      actions: [BOOK] },
    { id: "warranty", keys: ["warranty", "guarantee", "stand behind", "not right", "went wrong", "come back", "problem after", "still broken", "not fixed"],
      reply: "If something isn't right, we work with you to make it right. We stand behind our work, so just call " + PHONE + ".",
      actions: [CALL] },
    { id: "vehicles", keys: ["diesel", "diesel truck", "work on diesel", "heavy duty", "gasoline", "gas car", "make", "model", "kind of car", "what cars", "vehicles", "suv", "minivan", "pickup truck", "hybrid", "european", "honda", "toyota", "ford", "chevy", "gm", "bmw"],
      reply: "We diagnose and repair gasoline and diesel vehicles, from light duty to heavy duty: cars, SUVs, minivans, pickups, work trucks and trailers. For something specialized, call " + PHONE + " to confirm.",
      actions: [BOOK] },
    { id: "services", weight: 0.5, keys: ["services", "what do you do", "what do you", "offer", "do you fix", "do you do", "can you fix", "repair"],
      reply: "We do diagnostics, brakes, oil &amp; maintenance, tires, steering &amp; suspension, engine repair, A/C &amp; heating, transmission, electrical &amp; batteries, exhaust and inspections, plus alignments, glass, hitches, emissions testing and used car sales. " + link("services.html", "See all services"),
      actions: [SERVICES, BOOK] },
    { id: "pay", keys: ["pay", "credit", "card", "debit", "visa", "mastercard", "amex", "american express", "discover", "cash", "financing"],
      reply: "We accept Visa, Mastercard, American Express and Discover. Fleet customers can also use programs like PHH Fleet Management and Foss National Leasing. For anything else, call " + PHONE + ".",
      actions: [CALL] },
    { id: "pickup", keys: ["pick up", "pickup", "pick-up", "delivery", "deliver", "tow", "shuttle", "ride", "loaner", "courtesy car", "rental"],
      reply: "Free pick-up and delivery is available for most fleet vehicles and equipment. For a personal vehicle, or a loaner or ride, call " + PHONE + " and we'll let you know what we can arrange.",
      actions: [CALL] },
    { id: "about", keys: ["been around", "how long have you", "established", "since", "history", "about", "owner", "who are", "how old", "family", "independent", "experience", "years"],
      reply: "Pronto Automotive is an independent shop that has served Markham and the surrounding area since 1979. Our technicians specialize in gas and diesel diagnosis and repair, and the customer always comes first. " + link("about.html", "About Pronto"),
      actions: [BOOK] },
    { id: "reviews", keys: ["review", "rating", "reputation", "recommend", "good shop", "any good"],
      reply: "Customers say things like &ldquo;super friendly and helpful&rdquo;, &ldquo;didn't pressure me&rdquo; and &ldquo;the price was fair&rdquo;. " + link("index.html#reviews", "Read reviews"),
      actions: [BOOK] },
    { id: "thanks", keys: ["thank", "thx", "cheers", "appreciate", "great", "perfect", "awesome"],
      reply: "You're welcome! Anything else I can help with?",
      actions: [] },
    { id: "bye", keys: ["bye", "goodbye", "that's all", "thats all", "no thanks", "nothing else"],
      reply: "Thanks for chatting. Have a great day! We're at " + PHONE + " if you need us.",
      actions: [] },
    { id: "hi", keys: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
      reply: "Hi there! Ask me anything about our services, hours or location, or I can book an appointment for you.",
      actions: [BOOK] }
  ];

  var FALLBACK = {
    reply: "I'm not sure about that one. I can help with services, hours, location, prices, fleet programs and booking, or you can call " + PHONE + " or email " + EMAIL + " and the team will help.",
    actions: [BOOK, CALL, FAQ]
  };

  /* ---------- Matching ---------- */
  function norm(text) {
    return " " + text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\/\- ]+/g, " ").replace(/\s+/g, " ").trim() + " ";
  }

  // Edit distance where swapping two neighbouring letters counts as one typo ("brkae" -> "brake").
  function dist(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 9;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }

  // A key matches at the start of a word ("hi" never matches "this").
  // Single-word keys of 5+ letters also match a word with one typo: either the whole word
  // ("transmision") or its start when the key is a stem ("brkaes" -> "brake").
  function hasKey(q, words, key) {
    var i = q.indexOf(key);
    while (i !== -1) {
      if (!/[a-z0-9]/.test(q.charAt(i - 1))) return true;
      i = q.indexOf(key, i + 1);
    }
    if (key.length < 5 || key.indexOf(" ") !== -1) return false;
    for (var w = 0; w < words.length; w++) {
      var word = words[w];
      if (word.length < 4 || word[0] !== key[0]) continue;
      if (dist(word, key) <= 1 || dist(word.slice(0, key.length), key) <= 1) return true;
    }
    return false;
  }

  function scoreTopics(text) {
    var q = norm(text), words = q.trim().split(" ");
    return TOPICS.map(function (topic, index) {
      var score = 0;
      topic.keys.forEach(function (key) {
        if (hasKey(q, words, key)) score += key.indexOf(" ") !== -1 ? 2 : 1;
      });
      return { topic: topic, score: score * (topic.weight || 1), index: index };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.index - b.index; }); // ties: earlier, more specific topic
  }

  function best(text) {
    var hits = scoreTopics(text);
    return hits.length ? hits[0].topic : null;
  }

  // Split a message into its questions, answer each, and drop duplicates.
  // "What are your hours and do you fix brakes?" -> [hours, brakes]
  function findTopics(text) {
    var parts = text.split(/[?!.;\n]+|\band also\b|\balso\b|\bplus\b|,\s*(?=(?:and |do |can |what |where |when |how |are |is |i ))|\band\s+(?=(?:do |can |what |where |when |how |are |is |does |will |your |the |i |my ))/i);
    var found = [];
    var add = function (t) { if (t && found.indexOf(t) === -1) found.push(t); };
    parts.forEach(function (part) {
      if (!part || !part.trim()) return;
      // "Book my brakes" is two intents in one phrase: keep the booking intent next to the best other topic.
      // "How much is a brake job" is a question (price) about a service (brakes): answer both.
      var hits = scoreTopics(part);
      var strong = hits.filter(function (h) { return !h.topic.weight || h.topic.weight >= 1; });
      if (strong.length) hits = strong; // broad topics ("repair", "call") only answer when nothing specific matched
      var top = function (keep) { var h = hits.filter(function (h) { return keep(h.topic); })[0]; return h && h.topic; };
      var first = top(function (t) { return !t.startBooking; });
      add(first);
      if (first) add(top(function (t) { return !t.startBooking && !!t.service !== !!first.service; }));
      add(top(function (t) { return t.startBooking; }));
    });
    // Greetings and thanks only stand alone; drop them next to a real answer.
    if (found.length > 1) found = found.filter(function (t) { return ["hi", "thanks"].indexOf(t.id) === -1; });
    return found.slice(0, 4);
  }

  /* ---------- UI ---------- */
  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var launcher = el("button", "chat-launcher", ICON_CHAT + "<span>Ask Pronto</span>");
  launcher.type = "button";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "chatPanel");

  var panel = el("section", "chat-panel",
    '<header class="chat-head"><div><strong>Pronto Assistant</strong><span>Questions &amp; booking, any time</span></div>' +
    '<button type="button" class="chat-close" aria-label="Close chat">&times;</button></header>' +
    '<div class="chat-log" role="log" aria-live="polite"></div>' +
    '<div class="chat-chips" aria-label="Suggested questions"></div>' +
    '<form class="chat-form"><label class="sr-only" for="chatInput">Type a message</label>' +
    '<input id="chatInput" type="text" autocomplete="off" maxlength="400" placeholder="Ask a question or type &quot;book&quot;">' +
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

  // replies: HTML string (always built from our own text, user input escaped).
  // actions: link/button chips; picks: quick replies that are sent as if typed.
  function addBot(reply, actions, picks) {
    var msg = el("div", "chat-msg chat-bot");
    msg.appendChild(el("p", null, typeof reply === "function" ? reply() : reply));
    var row;
    if ((actions && actions.length) || (picks && picks.length)) row = el("div", "chat-actions");
    (actions || []).forEach(function (a) {
      var btn;
      if (a.href) {
        btn = el("a", "chat-action", a.label);
        btn.href = a.href;
        if (a.href.indexOf("http") === 0) { btn.target = "_blank"; btn.rel = "noopener noreferrer"; }
      } else {
        btn = el("button", "chat-action", a.label);
        btn.type = "button";
        btn.addEventListener("click", function () { if (a.action === "book") { addUser("Book an appointment"); startBooking(); } });
      }
      row.appendChild(btn);
    });
    (picks || []).forEach(function (label) {
      var btn = el("button", "chat-action chat-pick", esc(label));
      btn.type = "button";
      btn.addEventListener("click", function () { send(label); });
      row.appendChild(btn);
    });
    if (row) msg.appendChild(row);
    log.appendChild(msg);
    scrollDown();
  }

  function later(fn) { setTimeout(fn, 280); }

  /* ---------- In-chat booking ---------- */
  var BOOK_SERVICES = ["Diagnostics", "Brakes", "Oil & Maintenance", "Tires", "Steering & Suspension", "Engine Repair",
    "Air Conditioning", "Transmission", "Wheel Alignment", "Electrical & Batteries", "Exhaust & Mufflers",
    "Safety Inspection", "Pre-Purchase Inspection", "Fleet Service", "Not sure — please advise"];
  var booking = null; // null when not booking; otherwise { step, data }

  var STEPS = {
    service: { ask: "What do you need done? Pick one or describe it in your own words.",
      picks: ["Oil & Maintenance", "Brakes", "Diagnostics", "Tires", "Engine Repair", "Not sure — please advise"] },
    name:    { ask: "What's your name?" },
    phone:   { ask: "What's the best phone number to reach you? We'll call to confirm the time." },
    vehicle: { ask: "What vehicle is it? Year, make and model is perfect.", picks: ["Skip"] },
    date:    { ask: "Do you have a preferred day or time?", picks: ["As soon as possible", "Tomorrow", "This week", "Next week"] },
    email:   { ask: "Want a copy by email? Type your email address, or skip.", picks: ["Skip"] },
    notes:   { ask: "Anything else we should know? Symptoms, noises, warning lights...", picks: ["No, that's all"] }
  };
  var ORDER = ["service", "name", "phone", "vehicle", "date", "email", "notes"];

  function pickService(text) {
    var t = text.trim().toLowerCase();
    for (var i = 0; i < BOOK_SERVICES.length; i++) if (BOOK_SERVICES[i].toLowerCase() === t) return BOOK_SERVICES[i];
    var topic = best(text);
    return topic && topic.service ? topic.service : null;
  }

  function startBooking(service) {
    booking = { data: {} };
    if (service) booking.data.service = service;
    later(nextStep);
  }

  function nextStep() {
    var step = ORDER.filter(function (s) { return booking.data[s] === undefined; })[0];
    if (!step) return later(showSummary);
    booking.step = step;
    var s = STEPS[step];
    var intro = "";
    if (step === "name" && booking.data.service && !booking.greetedService) {
      booking.greetedService = true;
      intro = "Great, " + esc(booking.data.service.toLowerCase()) + ". ";
    }
    addBot(intro + s.ask + (step !== "service" ? ' <span class="chat-hint">Type &ldquo;cancel&rdquo; to stop.</span>' : ""), [], s.picks);
    input.focus();
  }

  var SKIP = /^(skip|no|none|n\/a|na|nope|no thanks|no, that's all|no that's all|that's all|nothing)$/i;

  function bookingAnswer(text) {
    var t = text.trim(), d = booking.data, step = booking.step;
    if (/^(cancel|stop|quit|exit|never ?mind)$/i.test(t)) {
      booking = null;
      return later(function () { addBot("No problem, I've cancelled that. Anything else I can help with?", [BOOK, CALL]); });
    }
    if (step === "confirm") {
      if (/^(yes|y|send|confirm|send request|looks good|correct|yep|yeah|sure)\b/i.test(t)) return submitBooking();
      if (/^(edit|change|start over|no)\b/i.test(t)) { booking = { data: {} }; return later(function () { addBot("Okay, let's start over."); later(nextStep); }); }
      return later(function () { addBot("Tap <strong>Send request</strong> to submit, <strong>Start over</strong> to change something, or type &ldquo;cancel&rdquo;.", [], ["Send request", "Start over"]); });
    }
    // A question in the middle of booking ("wait, are you open Saturday?") gets answered, then we pick up where we left off.
    if (["name", "phone", "email"].indexOf(step) !== -1) {
      var hit = scoreTopics(t)[0];
      if (/\?\s*$/.test(t) || (hit && hit.score >= 2) || t.split(/\s+/).length > 5) {
        var topics = findTopics(t).filter(function (x) { return !x.startBooking; });
        return later(function () {
          if (topics.length) topics.forEach(function (x) { addBot(x.reply); });
          else addBot("I didn't quite catch that.");
          addBot("Back to your booking: " + STEPS[step].ask, [], STEPS[step].picks);
        });
      }
    }
    if (step === "service") {
      d.service = pickService(t) || t.slice(0, 80);
    } else if (step === "name") {
      if (t.length < 2 || /\d{3}/.test(t)) return later(function () { addBot("Sorry, what name should we use for the booking?"); });
      d.name = t.slice(0, 80);
    } else if (step === "phone") {
      var digits = t.replace(/\D/g, "");
      if (digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
      if (digits.length !== 10) return later(function () { addBot("That doesn't look like a 10-digit phone number. Could you type it again? e.g. 905-555-0123"); });
      d.phone = digits.slice(0, 3) + "-" + digits.slice(3, 6) + "-" + digits.slice(6);
    } else if (step === "vehicle") {
      d.vehicle = SKIP.test(t) ? "" : t.slice(0, 80);
    } else if (step === "date") {
      d.date = SKIP.test(t) ? "" : t.slice(0, 80);
    } else if (step === "email") {
      if (SKIP.test(t)) d.email = "";
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) d.email = t;
      else return later(function () { addBot("That email doesn't look quite right. Try again, or tap Skip.", [], ["Skip"]); });
    } else if (step === "notes") {
      d.notes = SKIP.test(t) ? "" : t.slice(0, 400);
    }
    later(nextStep);
  }

  function showSummary() {
    var d = booking.data;
    booking.step = "confirm";
    var rows = [["Service", d.service], ["Name", d.name], ["Phone", d.phone], ["Vehicle", d.vehicle], ["Preferred", d.date], ["Email", d.email], ["Notes", d.notes]]
      .filter(function (r) { return r[1]; })
      .map(function (r) { return "<strong>" + r[0] + ":</strong> " + esc(r[1]); }).join("<br>");
    addBot("Here's your request:<br>" + rows + "<br><br>Send it to the Pronto team?", [], ["Send request", "Start over"]);
  }

  function submitBooking() {
    var d = booking.data, cfg = window.prontoForm;
    booking.step = "sending";
    addBot("Sending your request...");
    var fail = function () {
      booking.step = "confirm";
      addBot("Sorry, I couldn't send that just now. Please try again, or call " + PHONE + " and we'll book you in.", [CALL], ["Send request"]);
    };
    if (!cfg || !window.fetch) return fail();
    fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: d.name, phone: d.phone, email: d.email, vehicle: d.vehicle, service: d.service,
        preferred_date: d.date, message: d.notes, source: "Website chat assistant",
        _subject: "Service request (chat): " + d.service + " - " + d.name,
        _cc: cfg.cc, _template: "table", _captcha: "false"
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || String(j.success) === "false") throw new Error(j.message || "failed");
      });
    }).then(function () {
      var name = d.name.split(" ")[0];
      booking = null;
      addBot("Done, thanks " + esc(name) + "! Your request is in. A member of the Pronto team will call you at <strong>" + esc(d.phone) +
        "</strong> to confirm a time. Your appointment isn't confirmed until they do. Anything else I can help with?", [CALL]);
    }).catch(fail);
  }

  /* ---------- Conversation ---------- */
  function send(text) {
    text = String(text).trim();
    if (!text) return;
    addUser(text);
    if (booking && booking.step === "sending") return;
    if (booking) return bookingAnswer(text);

    var topics = findTopics(text);
    if (!topics.length) return later(function () { addBot(FALLBACK.reply, FALLBACK.actions); });

    var bookTopic = topics.filter(function (t) { return t.startBooking; })[0];
    var answers = topics.filter(function (t) { return !t.startBooking; });
    later(function () {
      answers.forEach(function (t, i) {
        // Actions only on the last answer, so several answers don't stack duplicate buttons.
        var acts = i === answers.length - 1 && !bookTopic ? t.actions : [];
        addBot(t.reply, acts);
      });
      if (bookTopic) {
        var service = answers.map(function (t) { return t.service; }).filter(Boolean)[0];
        addBot(bookTopic.reply);
        startBooking(service);
      }
    });
  }

  ["Book service", "Hours", "Where are you?", "Do you fix diesel?", "Prices"].forEach(function (label) {
    var chip = el("button", null, esc(label));
    chip.type = "button";
    chip.addEventListener("click", function () { send(label); });
    chips.appendChild(chip);
  });

  function openChat() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      addBot("Hi! I'm Pronto's assistant. Ask me anything about our services, hours, prices or location, and I can <strong>book an appointment</strong> for you right here. For anything urgent, call " + PHONE + ".", [BOOK]);
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
    send(input.value);
    input.value = "";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) closeChat();
  });
})();
