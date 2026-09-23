/* Pronto Automotive - shared behaviour for every page */
(function(){
  "use strict";
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  /* ---- Header shadow + scrollspy ---- */
  var header = $("#header");
  // Only in-page links (#section) take part; links to other pages are left alone.
  var spyLinks = $$(".nav-links a[data-spy]").filter(function(l){
    return (l.getAttribute("href") || "").charAt(0) === "#";
  });
  var spyTargets = spyLinks.map(function(l){ return document.querySelector(l.getAttribute("href")); });

  function spy(){
    if(!header || !spyLinks.length) return;
    var pos = window.scrollY + header.offsetHeight + 130, idx = -1, best = -Infinity;
    spyTargets.forEach(function(t,i){
      if(!t) return;
      var top = t.getBoundingClientRect().top + window.pageYOffset;
      if(top <= pos && top >= best){ best = top; idx = i; }
    });
    spyLinks.forEach(function(l,i){ l.classList.toggle("active", i === idx); });
  }
  function onScroll(){
    if(header) header.classList.toggle("stuck", window.scrollY > 40);
    spy();
  }
  window.addEventListener("scroll", onScroll, {passive:true});

  /* ---- Mobile nav ---- */
  var burger = $("#burger"), mnav = $("#mobileNav");
  function closeNav(){
    if(!burger || !mnav) return;
    burger.classList.remove("open"); mnav.classList.remove("open");
    burger.setAttribute("aria-expanded","false");
  }
  if(burger && mnav){
    burger.addEventListener("click", function(){
      var open = burger.classList.toggle("open");
      mnav.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---- Smooth scroll for in-page links ---- */
  $$("[data-scroll]").forEach(function(a){
    a.addEventListener("click", function(e){
      var id = a.getAttribute("href");
      if(!id || id.charAt(0) !== "#") return;
      var t = document.querySelector(id);
      if(!t) return;
      e.preventDefault();
      closeNav();
      var offset = header ? header.offsetHeight : 0;
      var top = t.getBoundingClientRect().top + window.pageYOffset - offset + 1;
      window.scrollTo({top: Math.max(top,0), behavior:"smooth"});
    });
  });

  /* ---- Moving photo header: runs continuously ---- */
  var heroFrame = $("#heroFrame");
  var prefersCalm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(heroFrame && !prefersCalm) heroFrame.classList.add("is-animated");

  /* ---- Review carousel ---- */
  var carousel = $("#reviewCarousel");
  if(carousel){
    var slides = $$(".rev-slide", carousel);
    var dotsWrap = $(".rev-dots", carousel);
    var current = 0, timer = null, holding = false;
    var INTERVAL = 5000;

    var dots = slides.map(function(_, i){
      var d = document.createElement("button");
      d.type = "button";
      d.className = "rev-dot";
      d.setAttribute("aria-label", "Show review " + (i + 1) + " of " + slides.length);
      d.addEventListener("click", function(){ show(i); restart(); });
      dotsWrap.appendChild(d);
      return d;
    });

    function show(i){
      current = (i + slides.length) % slides.length;
      slides.forEach(function(s, k){
        var on = k === current;
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-hidden", String(!on));
      });
      dots.forEach(function(d, k){ d.setAttribute("aria-current", k === current ? "true" : "false"); });
    }
    function restart(){
      clearInterval(timer);
      timer = setInterval(function(){
        // Hold while someone is reading (hovering or using the controls).
        if(!holding && !document.hidden) show(current + 1);
      }, INTERVAL);
    }

    $$(".rev-arrow", carousel).forEach(function(b){
      b.addEventListener("click", function(){
        show(current + Number(b.getAttribute("data-dir")));
        restart();
      });
    });
    carousel.addEventListener("mouseenter", function(){ holding = true; });
    carousel.addEventListener("mouseleave", function(){ holding = false; });
    carousel.addEventListener("focusin", function(){ holding = true; });
    carousel.addEventListener("focusout", function(){ holding = false; });

    var startX = null;
    carousel.addEventListener("touchstart", function(e){ startX = e.touches[0].clientX; }, {passive:true});
    carousel.addEventListener("touchend", function(e){
      if(startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if(Math.abs(dx) > 40){ show(current + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    });

    show(0);
    restart();
  }

  /* ---- Footer year ---- */
  var yr = $("#yr");
  if(yr) yr.textContent = new Date().getFullYear();

  /* ---- Booking modal ---- */
  var modal = $("#modal"), form = $("#bookForm");
  if(!modal || !form){ onScroll(); return; }

  // Token routes to aran.luxman@gmail.com (activated); FORM_CC gets a copy.
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/d8c7d379297441922ad465906d5c49d9";
  var FORM_CC = "info@prontomarkham.com";
  var lastFocus = null;
  var phone = $("#b-phone");
  var submitBtn = $("#bookSubmit");
  var formError = $("#formError");

  function openModal(service){
    lastFocus = document.activeElement;
    closeNav();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var d = new Date();
    $("#b-date").min = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
    if(service){
      var sel = $("#b-service");
      $$("option", sel).forEach(function(o){ if(o.textContent.trim() === service) sel.value = o.value || o.textContent.trim(); });
    }
    requestAnimationFrame(function(){
      modal.classList.add("open");
      setTimeout(function(){ $("#b-name").focus(); }, 120);
    });
  }
  function closeModal(){
    modal.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function(){
      modal.hidden = true;
      clearErrors();
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }, 300);
  }
  $$("[data-book]").forEach(function(b){
    b.addEventListener("click", function(){ openModal(b.getAttribute("data-service")); });
  });
  $$("[data-close]").forEach(function(b){ b.addEventListener("click", closeModal); });

  document.addEventListener("keydown", function(e){
    if(modal.hidden) return;
    if(e.key === "Escape"){ closeModal(); return; }
    if(e.key === "Tab"){
      var f = $$("button, input, select, textarea, a[href]", modal)
        .filter(function(el){ return el.offsetParent !== null && !el.disabled; });
      if(!f.length) return;
      var first = f[0], last = f[f.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  phone.addEventListener("input", function(){
    var v = phone.value.replace(/\D/g,"").slice(0,10);
    if(v.length > 6)      phone.value = v.slice(0,3)+"-"+v.slice(3,6)+"-"+v.slice(6);
    else if(v.length > 3) phone.value = v.slice(0,3)+"-"+v.slice(3);
    else                  phone.value = v;
  });

  function clearErrors(){
    $$("input, select", form).forEach(function(f){ f.classList.remove("err"); });
    $$(".err-msg", form).forEach(function(p){ p.classList.remove("show"); });
    if(formError){ formError.hidden = true; formError.textContent = ""; }
  }
  function fail(el){
    el.classList.add("err");
    var m = el.parentElement.querySelector(".err-msg");
    if(m) m.classList.add("show");
  }
  $$("input, select", form).forEach(function(f){
    ["input","change"].forEach(function(ev){
      f.addEventListener(ev, function(){
        f.classList.remove("err");
        var m = f.parentElement.querySelector(".err-msg");
        if(m) m.classList.remove("show");
      });
    });
  });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    clearErrors();
    var name = $("#b-name"), svc = $("#b-service"), email = $("#b-email");
    var ok = true, firstBad = null;

    if(!name.value.trim()){ fail(name); ok = false; firstBad = firstBad || name; }
    if(phone.value.replace(/\D/g,"").length < 10){ fail(phone); ok = false; firstBad = firstBad || phone; }
    if(!svc.value){ fail(svc); ok = false; firstBad = firstBad || svc; }
    if(email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())){
      fail(email); ok = false; firstBad = firstBad || email;
    }
    if(!ok){ if(firstBad) firstBad.focus(); return; }

    // Spam trap: real visitors never see or fill this field.
    var honey = form.querySelector('[name="_honey"]');
    if(honey && honey.value) return;

    var payload = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      email: email.value.trim(),
      vehicle: $("#b-vehicle").value.trim(),
      service: svc.value,
      preferred_date: $("#b-date").value,
      message: $("#b-message").value.trim(),
      _subject: "Service request: " + svc.value + " - " + name.value.trim(),
      _cc: FORM_CC,
      _template: "table",
      _captcha: "false"
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function(r){
        return r.json().catch(function(){ return {}; }).then(function(j){
          if(!r.ok || String(j.success) === "false") throw new Error(j.message || "Request failed");
          return j;
        });
      })
      .then(function(){
        form.reset();
        closeModal();
        showToast();
      })
      .catch(function(err){
        formError.textContent = /activat/i.test(err.message)
          ? "Almost ready: this form needs a one-time activation. Check the booking inbox for the FormSubmit activation email, then send again."
          : "We couldn't send your request just now. Please call 905-294-9476 or email info@prontomarkham.com.";
        formError.hidden = false;
      })
      .then(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = "Request Appointment";
      });
  });

  var toast = $("#toast"), tTimer;
  function showToast(){
    if(window.prontoToast){ window.prontoToast(); return; }
    clearTimeout(tTimer);
    toast.classList.add("show");
    tTimer = setTimeout(function(){ toast.classList.remove("show"); }, 6000);
  }

  onScroll();
})();
