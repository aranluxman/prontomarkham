/* Pronto Automotive - motion layer (loaded on every page after site.js).
   Every effect is optional polish: without JS, without IntersectionObserver
   or with prefers-reduced-motion, content appears immediately in its final state. */
(function(){
  "use strict";
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var canObserve = "IntersectionObserver" in window;

  /* ---- 1. Scroll reveal with sibling stagger ---- */
  var REVEAL = [
    ".section-head", ".trust-item", ".svc-card", ".svc-extra", ".why-item", ".rev-carousel",
    ".step", ".map-card", ".loc-info", ".final-cta .wrap", ".split > *",
    ".prose > h2", ".check-list", ".feature-pair > div", ".name-grid", ".aside-card"
  ];
  REVEAL.forEach(function(sel){ $$(sel).forEach(function(el){ el.classList.add("reveal"); }); });
  var revealEls = $$(".reveal");
  revealEls.forEach(function(el){
    var siblings = Array.prototype.filter.call(el.parentElement.children, function(c){ return c.classList.contains("reveal"); });
    el.style.setProperty("--stagger", Math.min(siblings.indexOf(el), 8));
  });

  if(!reduce && canObserve){
    root.classList.add("motion-ready");
    var revealIO = null;
    var showEl = function(el){
      if(el.classList.contains("is-visible") || !el.classList.contains("reveal")) return;
      if(revealIO) revealIO.unobserve(el);
      el.classList.add("is-visible");
      // Hand the element back to its own transitions (e.g. card hover) once revealed.
      var stagger = parseFloat(el.style.getPropertyValue("--stagger")) || 0;
      setTimeout(function(){ el.classList.remove("reveal", "is-visible"); }, 900 + stagger * 60);
    };
    revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){ if(entry.isIntersecting) showEl(entry.target); });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
    revealEls.forEach(function(el){ revealIO.observe(el); });
    // Safety net: never leave on-screen content hidden if observer callbacks arrive late.
    window.addEventListener("load", function(){
      setTimeout(function(){
        var vh = window.innerHeight;
        $$(".reveal").forEach(function(el){
          var r = el.getBoundingClientRect();
          if(r.top < vh && r.bottom > 0) showEl(el);
        });
      }, 1500);
    });
  }

  /* ---- 2. Rotating hero words ---- */
  var rotator = $(".rotator");
  if(rotator){
    var words = $$("span", rotator);
    words.forEach(function(w, i){ if(i) w.setAttribute("aria-hidden", "true"); });
    if(!reduce && canObserve && words.length > 1){
      var wordIndex = 0;
      words[0].classList.add("is-in");
      setInterval(function(){
        if(document.hidden) return;
        var outgoing = words[wordIndex];
        wordIndex = (wordIndex + 1) % words.length;
        var incoming = words[wordIndex];
        outgoing.classList.remove("is-in");
        outgoing.classList.add("is-out");
        outgoing.setAttribute("aria-hidden", "true");
        // Snap the incoming word to its start position below, then animate it in.
        incoming.style.transition = "none";
        incoming.classList.remove("is-out", "is-in");
        void incoming.offsetWidth;
        incoming.style.transition = "";
        incoming.classList.add("is-in");
        incoming.removeAttribute("aria-hidden");
      }, 2600);
    }
  }

  /* ---- 3. Live open / closed status (America/Toronto) ---- */
  var HOURS = { 1:[8,17], 2:[8,17], 3:[8,17], 4:[8,17], 5:[8,17], 6:[8,12] }; // Sunday (0) closed
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var WEEKDAY = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  var torontoFormat = null;
  try {
    torontoFormat = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Toronto", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
    });
  } catch(e){ torontoFormat = null; }

  function torontoNow(){
    var now = new Date();
    if(!torontoFormat) return { day: now.getDay(), mins: now.getHours() * 60 + now.getMinutes() };
    var parts = {};
    torontoFormat.formatToParts(now).forEach(function(p){ parts[p.type] = p.value; });
    return {
      day: WEEKDAY[parts.weekday.slice(0, 3)],
      mins: (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10)
    };
  }
  function clock(h){ return (h % 12 || 12) + (h < 12 ? " AM" : " PM"); }

  function currentStatus(t){
    var today = HOURS[t.day];
    if(today && t.mins >= today[0] * 60 && t.mins < today[1] * 60){
      return { open: true, text: "Open now · until " + clock(today[1]) };
    }
    if(today && t.mins < today[0] * 60){
      return { open: false, text: "Opens today at " + clock(today[0]) };
    }
    for(var i = 1; i <= 7; i++){
      var d = (t.day + i) % 7;
      if(HOURS[d]){
        return { open: false, text: "Closed now · opens " + (i === 1 ? "tomorrow" : DAY_NAMES[d]) + " at " + clock(HOURS[d][0]) };
      }
    }
    return { open: false, text: "Closed now" };
  }

  function paintStatus(){
    var t = torontoNow();
    var s = currentStatus(t);
    $$(".status-pill").forEach(function(pill){
      pill.classList.toggle("is-closed", !s.open);
      var label = $(".status-text", pill);
      if(label) label.textContent = s.text;
      pill.hidden = false;
    });
    $$(".hours-row[data-days]").forEach(function(row){
      var isToday = row.getAttribute("data-days").split(",").indexOf(String(t.day)) !== -1;
      row.classList.toggle("is-today", isToday);
      var tag = $(".today-tag", row);
      if(isToday && !tag){
        tag = document.createElement("span");
        tag.className = "today-tag";
        tag.textContent = "Today";
        row.firstElementChild.appendChild(tag);
      } else if(!isToday && tag){
        tag.parentNode.removeChild(tag);
      }
    });
  }
  if($(".status-pill") || $(".hours-row[data-days]")){
    paintStatus();
    setInterval(paintStatus, 60000);
  }

  /* ---- 5. Count-up numbers (final values live in the HTML) ---- */
  function countUp(el){
    var to = parseFloat(el.getAttribute("data-count"));
    var from = parseFloat(el.getAttribute("data-count-from") || "0");
    var start = null;
    function frame(ts){
      if(start === null) start = ts;
      var p = Math.min((ts - start) / 1200, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if(p < 1) requestAnimationFrame(frame);
    }
    el.textContent = from;
    requestAnimationFrame(frame);
  }
  var counters = $$("[data-count]");
  // Reserve width only where the digit count changes while counting (e.g. 0 -> 45).
  counters.forEach(function(el){
    if(!el.hasAttribute("data-count-from")) el.style.minWidth = String(el.getAttribute("data-count")).length + "ch";
  });
  if(counters.length && !reduce && canObserve){
    var countIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function(el){ countIO.observe(el); });
  }

  /* ---- 9. How it works: connecting line + step pops ---- */
  var steps = $(".steps");
  if(steps){
    var setTail = function(){
      var last = steps.lastElementChild;
      if(last) steps.style.setProperty("--steps-tail", Math.max(last.offsetHeight - 23, 0) + "px");
    };
    setTail();
    window.addEventListener("resize", setTail);
    if(reduce || !canObserve){
      steps.classList.add("is-drawn");
    } else {
      var stepsIO = new IntersectionObserver(function(entries){
        if(entries[0].isIntersecting){ steps.classList.add("is-drawn"); stepsIO.disconnect(); }
      }, { threshold: 0.3 });
      stepsIO.observe(steps);
    }
  }

  /* ---- 11. Success toast (called by site.js after a booking is sent) ---- */
  var toast = $("#toast");
  var toastTimer = null;
  function hideToast(){ if(toast) toast.classList.remove("show"); }
  window.prontoToast = function(){
    if(!toast) return;
    clearTimeout(toastTimer);
    toast.classList.add("show");
    toastTimer = setTimeout(hideToast, 5500);
  };
  var toastClose = toast && $(".toast-close", toast);
  if(toastClose){
    toastClose.addEventListener("click", function(){ clearTimeout(toastTimer); hideToast(); });
  }
})();
