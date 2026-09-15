"""Generate the service pages and fleet page from the homepage's shared chrome.

Run from anywhere:  python tools/build_pages.py
Header, footer, booking form and chat come from index.html, so editing those
there and re-running keeps every page consistent.
"""
import html, pathlib, re

SITE = pathlib.Path(__file__).resolve().parent.parent
BASE_URL = "https://aranluxman.github.io/prontomarkham/"
home = (SITE / "index.html").read_text(encoding="utf-8")

CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'

top = home[home.index("<body>") + len("<body>"): home.index("<main")]
bottom = home[home.index("<!-- ========== FOOTER"): home.index("</body>")]

def chrome(fragment, root, active):
    out = fragment
    for sec in ("top", "services", "fleet", "about", "reviews", "contact"):
        target = {"top": "index.html", "fleet": "fleet.html"}.get(sec, "index.html#" + sec)
        out = re.sub(r'href="#' + sec + r'"( data-scroll)?( data-spy="[a-z]+")?', 'href="' + root + target + '"', out)
    out = re.sub(r'(href|src)="(css|js|assets|services)/', lambda m: f'{m.group(1)}="{root}{m.group(2)}/', out)
    out = out.replace('href="fleet.html"', 'href="' + root + 'fleet.html"')
    if active:
        out = out.replace('<li><a href="' + root + active[0] + '">' + active[1] + "</a></li>",
                          '<li><a href="' + root + active[0] + '" class="active" aria-current="page">' + active[1] + "</a></li>", 1)
    return out

def page(path, title, description, body, active):
    root = "../" * path.count("/")
    head = f"""<!DOCTYPE html>
<html lang="en" data-root="{root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description)}">
<link rel="canonical" href="{BASE_URL}{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Pronto Automotive">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}css/styles.css">
<link rel="stylesheet" href="{root}css/components.css">
<link rel="stylesheet" href="{root}css/chat.css">
<link rel="stylesheet" href="{root}css/motion.css">
<link rel="icon" href="{root}assets/logo/favicon.svg" type="image/svg+xml">
</head>
<body>
"""
    doc = head + chrome(top, root, active) + '<main id="top">\n' + body.replace("{root}", root) + "\n</main>\n\n" + chrome(bottom, root, None) + "</body>\n</html>\n"
    target = SITE / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(doc, encoding="utf-8")
    return path

def checks(items):
    return '<ul class="check-list">' + "".join(f"<li>{CHECK}<span>{i}</span></li>" for i in items) + "</ul>"

SERVICES = [
  dict(slug="oil-maintenance", name="Oil &amp; Maintenance", book="Oil &amp; Maintenance", img="svc-maintenance.jpg",
       title="Oil Changes &amp; Vehicle Maintenance in Markham",
       lede="Regular maintenance is the simplest way to keep a vehicle safe, reliable and ready for Ontario weather. Whether you need an oil change or an engine change, we look after gas and diesel vehicles from light to heavy duty.",
       what="Engine oil protects moving parts from heat and wear, and filters keep dirt out of the engine, cabin and fuel system. Over time fluids break down and parts wear, so routine service catches small issues before they turn into expensive repairs.",
       signs=["Oil change or service reminder on the dash", "Engine running rougher or louder than usual", "Dark, gritty or low engine oil", "Due for a seasonal check before winter or a road trip"],
       includes=["Lube, oil &amp; filter service", "Tune-ups", "Coolant flush", "Brake fluid flush", "Power steering flush", "Transmission, transfer case &amp; differential service", "Fuel system &amp; intake cleaning", "Belt &amp; hose replacement"]),
  dict(slug="brakes", name="Brakes", book="Brakes", img="svc-brakes.jpg",
       title="Brake Repair &amp; Inspection in Markham",
       lede="Your brakes are the most important safety system on your vehicle. We inspect them carefully, explain what we find and replace only what actually needs replacing.",
       what="Brake pads press against rotors to slow the vehicle, and brake fluid carries the force from the pedal to each wheel. Pads and rotors wear with every stop, and brake fluid absorbs moisture over time, which reduces stopping power.",
       signs=["Squealing, grinding or scraping when braking", "Soft, spongy or sinking pedal", "Vehicle pulls to one side when stopping", "Brake or ABS warning light", "Vibration through the pedal or steering wheel"],
       includes=["Pad and rotor inspection and replacement", "Caliper and brake hardware service", "Brake fluid flush", "ABS diagnosis", "Brake systems for fleet and heavier-duty vehicles"]),
  dict(slug="diagnostics", name="Diagnostics", book="Diagnostics", img="svc-diagnostics.jpg",
       title="Car &amp; Truck Diagnostics in Markham",
       lede="Diagnosis is where good repairs start. We specialize in finding the real cause of warning lights and hard-to-find problems on gasoline and diesel vehicles, so the right repair happens the first time.",
       what="Modern vehicles are run by computers that monitor the engine, transmission, brakes and electrical systems. A scan tool reads the fault codes they store, and an experienced technician uses that data with hands-on testing to pinpoint the actual problem instead of guessing.",
       signs=["Check engine or other warning light on", "Stalling, hesitation or rough running", "Starting or no-start problems", "Electrical faults, lighting or battery drain", "Poor fuel economy"],
       includes=["Computer diagnostics and fault code analysis", "Electrical and lighting diagnosis", "Starters, alternators, batteries and no-starts", "Emission testing", "A clear explanation before any repair"]),
  dict(slug="tires", name="Tires", book="Tires", img="svc-tires.jpg",
       title="Tire Service in Markham",
       lede="Tires are the only part of your vehicle that touches the road. We help you choose the right tires, install and balance them properly, and keep them lined up so they wear evenly.",
       what="Tread depth, pressure, balance and alignment all affect grip, braking distance and how long tires last. In Ontario, seasonal tires make a real difference to safety when the weather turns.",
       signs=["Worn or uneven tread", "Vibration at highway speed", "Vehicle pulling to one side", "Frequent low tire pressure", "Time for a seasonal changeover"],
       includes=["Tire supply and installation", "Mounting and balancing", "Seasonal tire changeovers", "Wheel alignment", "Tires for cars, trucks and fleet vehicles"]),
  dict(slug="steering-suspension", name="Steering &amp; Suspension", book="Steering &amp; Suspension", img="svc-suspension.jpg",
       title="Steering, Suspension &amp; Alignment in Markham",
       lede="Your steering and suspension keep the vehicle stable, comfortable and in control. We diagnose clunks, pulls and rough rides, and get your vehicle tracking straight again.",
       what="Shocks, struts, bushings, ball joints and tie rods absorb bumps and keep your tires in contact with the road. When they wear, handling suffers, tires wear faster and braking distances can grow.",
       signs=["Clunking or knocking over bumps", "Vehicle pulls, drifts or wanders", "Bouncy or unusually rough ride", "Uneven tire wear", "Steering wheel off-centre or loose"],
       includes=["Shocks and struts", "Steering components and power steering service", "Wheel alignment", "Suspension and driveline repair", "Service for light to heavy-duty vehicles"]),
  dict(slug="engine-repair", name="Engine Repair", book="Engine Repair", img="svc-engine-repair.jpg",
       title="Engine Repair in Markham",
       lede="From small leaks to major mechanical work, we repair gasoline and diesel engines on light to heavy-duty vehicles, with a clear explanation of what&rsquo;s needed before we begin.",
       what="Your engine relies on its cooling system, belts, hoses, pumps and sensors working together. Catching a leak, overheating issue or misfire early usually means a smaller repair and less time off the road.",
       signs=["Overheating or temperature gauge climbing", "Oil or coolant leaks", "Misfires, knocking or loss of power", "Smoke from the exhaust", "Check engine light"],
       includes=["Cooling systems and radiators", "Hoses, belts and pumps", "Gasoline and diesel engine repair", "Air conditioning and HVAC", "Exhaust repair", "Drive train and differential"]),
]

written = []
for svc in SERVICES:
    others = "".join(f'<li><a href="{{root}}services/{o["slug"]}.html"' + (' aria-current="page"' if o is svc else "") + f'>{o["name"]}</a></li>' for o in SERVICES)
    body = f"""
  <section class="page-hero">
    <div class="wrap page-hero-grid">
      <div>
        <nav class="crumbs" aria-label="Breadcrumb"><a href="{{root}}index.html">Home</a><span aria-hidden="true">/</span><a href="{{root}}index.html#services">Services</a><span aria-hidden="true">/</span><span>{svc["name"]}</span></nav>
        <div class="eyebrow">Our Services</div>
        <h1>{svc["title"]}</h1>
        <p class="lede">{svc["lede"]}</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" data-book data-service="{html.unescape(svc["book"])}">Book {svc["name"]}</button>
          <a href="tel:+19052949476" class="btn btn-outline btn-lg">Call 905-294-9476</a>
        </div>
      </div>
      <div class="page-hero-media"><img src="{{root}}assets/{svc["img"]}" width="760" height="535" alt=""></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap page-body">
      <div class="prose">
        <h2>What it is</h2>
        <p>{svc["what"]}</p>
        <h2>Signs you should book a visit</h2>
        {checks(svc["signs"])}
        <h2>What we can help with</h2>
        {checks(svc["includes"])}
        <h2>Work we stand behind</h2>
        <p>We&rsquo;ll inspect your vehicle, explain what we find in plain language and walk you through your options before any work begins. If something isn&rsquo;t right, we work with you to make it right.</p>
      </div>
      <aside class="aside-card">
        <h3>Need {svc["name"].lower()} service?</h3>
        <p>Send a request and a member of the Pronto team will contact you to confirm a time.</p>
        <button class="btn btn-primary" data-book data-service="{html.unescape(svc["book"])}">Book Service</button>
        <a href="tel:+19052949476" class="btn btn-outline">Call 905-294-9476</a>
        <ul class="aside-links">{others}</ul>
      </aside>
    </div>
  </section>"""
    desc = re.sub(r"&[a-z]+;", "'", html.unescape(svc["lede"]))[:155]
    written.append(page(f'services/{svc["slug"]}.html', html.unescape(svc["title"]) + " | Pronto Automotive", html.unescape(svc["lede"])[:155], body, None))

FLEET_BODY = f"""
  <section class="page-hero">
    <div class="wrap page-hero-grid">
      <div>
        <nav class="crumbs" aria-label="Breadcrumb"><a href="{{root}}index.html">Home</a><span aria-hidden="true">/</span><span>Fleet Services</span></nav>
        <div class="eyebrow">Fleet Support</div>
        <h1>Reliable Fleet Maintenance &amp; Repair</h1>
        <p class="lede">Fleets large and small, local and nationwide, trust Pronto Automotive to keep their cars, trucks and trailers working. Let us take the burden of fleet maintenance off your plate.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" data-book data-service="Fleet Service">Talk About Your Fleet</button>
          <a href="tel:+19052949476" class="btn btn-outline btn-lg">Call 905-294-9476</a>
        </div>
      </div>
      <div class="page-hero-media"><img src="{{root}}assets/fleet-service.jpg" width="1400" height="933" alt="Commercial vans and trucks lined up outside a fleet service garage."></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap page-body">
      <div class="prose">
        <h2>Built around your business</h2>
        {checks(["Fleets large &amp; small, local and nationwide", "Car, truck &amp; trailer repair", "Complete maintenance programs, from basic to comprehensive", "Customized and flexible for your business needs and budget", "Strategic service planning for cost effectiveness and efficiency", "We follow your existing service guidelines, with supporting documentation", "Free pick-up &amp; delivery for most vehicles and equipment", "Preventive maintenance that keeps your business moving"])}

        <h2>Why fleets choose Pronto</h2>
        <div class="feature-pair">
          <div><h3>Technical skill</h3><p>Our technicians regularly train above industry-standard skill levels, backed by in-house service audit programs, to ensure the best service for your fleet.</p></div>
          <div><h3>Fleet expertise</h3><p>Our experience, communication and scheduling minimize vehicle downtime and maximize fleet reliability. We drive your bottom line!</p></div>
        </div>

        <h2>For logistics managers</h2>
        <p>Let us alleviate the burden of fleet maintenance control with our proven results!</p>
        <h2>Fleet vehicle services</h2>
        <p>Just a sampling of what we do &mdash; there&rsquo;s lots more.</p>
        {checks(["On-site glass service", "Annual inspections", "HVAC and A/C", "Starters and alternators", "Tires and exhaust", "Cooling systems", "Brake systems and ABS", "Accessory installations", "Lighting and electrical", "Mobile and emission testing", "Complete trailer repair", "Drive train and differential", "Steering and alignment", "Batteries and no-starts", "Hydraulics", "PM service and oil changes", "Suspension and driveline", "Hoses, belts and pumps"])}

        <h2>Fleet customers include</h2>
        <ul class="name-grid">{"".join(f"<li>{n}</li>" for n in ["York Regional Police", "Ontario Electric", "D. Crupi &amp; Sons", "The Miller Group", "Signode Canada", "Citywide Locksmiths", "Cross Canada Car Leasing", "Don Clarke Contracting", "Dagmar Construction"])}</ul>
        <p style="margin-top:12px">and many more.</p>

        <h2>Fleet programs we accept</h2>
        <ul class="name-grid">{"".join(f"<li>{n}</li>" for n in ["PHH Fleet Management", "GE Capital Fleet", "Corporate Card", "Foss National Leasing", "Transportaction Lease Systems"])}</ul>
      </div>
      <aside class="aside-card">
        <h3>Set up a fleet program</h3>
        <p>Tell us about your vehicles and schedule, and we&rsquo;ll put together a maintenance plan that fits your business.</p>
        <button class="btn btn-primary" data-book data-service="Fleet Service">Request Fleet Service</button>
        <a href="tel:+19052949476" class="btn btn-outline">Call 905-294-9476</a>
        <a href="tel:+18774776686" class="btn btn-outline">Toll-free 1-877-477-6686</a>
      </aside>
    </div>
  </section>"""
written.append(page("fleet.html", "Fleet Maintenance & Repair in Markham | Pronto Automotive",
    "Fleet maintenance and repair for cars, trucks and trailers in Markham since 1979. Custom programs, free pick-up and delivery for most vehicles.",
    FLEET_BODY, ("fleet.html", "Fleet")))

urls = ["", "fleet.html"] + [f'services/{s["slug"]}.html' for s in SERVICES]
(SITE / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"  <url><loc>{BASE_URL}{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(SITE / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}sitemap.xml\n", encoding="utf-8")
print("wrote:", ", ".join(written), "+ sitemap.xml, robots.txt")