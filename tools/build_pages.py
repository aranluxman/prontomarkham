"""Generate every page except the homepage from the homepage's shared chrome:
service pages, the services hub, fleet, about, contact, FAQ, service areas and 404,
plus sitemap.xml and robots.txt.

Run from anywhere:  python tools/build_pages.py
Header, footer, booking form and chat come from index.html, so editing those
there and re-running keeps every page consistent.
"""
import datetime, html, json, pathlib, re

SITE = pathlib.Path(__file__).resolve().parent.parent
BASE_URL = "https://prontomarkham.com/"
BUSINESS_ID = BASE_URL + "#business"
TODAY = datetime.date.today().isoformat()

def clean_url(path):
    """Public URL for a file: the host 308-redirects *.html to the extensionless path."""
    return BASE_URL + re.sub(r"(^|/)index\.html$", r"\1", path).removesuffix(".html")

home = (SITE / "index.html").read_text(encoding="utf-8")

CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'

top = home[home.index("<body>") + len("<body>"): home.index("<main")]
bottom = home[home.index("<!-- ========== FOOTER"): home.index("</body>")]

def chrome(fragment, root, active):
    out = fragment
    for sec in ("top", "services", "fleet", "about", "reviews", "contact"):
        target = {"top": "index.html", "fleet": "fleet.html", "services": "services.html",
                  "about": "about.html", "contact": "contact.html"}.get(sec, "index.html#" + sec)
        out = re.sub(r'href="#' + sec + r'"( data-scroll)?( data-spy="[a-z]+")?', 'href="' + root + target + '"', out)
    out = re.sub(r'(href|src)="(css|js|assets|services)/', lambda m: f'{m.group(1)}="{root}{m.group(2)}/', out)
    out = re.sub(r'href="(?!https?:|tel:|mailto:|#|\.\./)([a-z0-9-]+\.html)', lambda m: f'href="{root}{m.group(1)}', out)
    if active:
        out = out.replace('<li><a href="' + root + active[0] + '">' + active[1] + "</a></li>",
                          '<li><a href="' + root + active[0] + '" class="active" aria-current="page">' + active[1] + "</a></li>", 1)
    return out

def crumbs_html(trail):
    parts = [f'<a href="{{root}}{p}">{n}</a>' if p else f"<span>{n}</span>" for n, p in trail]
    return '<nav class="crumbs" aria-label="Breadcrumb">' + '<span aria-hidden="true">/</span>'.join(parts) + "</nav>"

def breadcrumb_schema(trail, path):
    items = [dict(zip(("name", "path"), (html.unescape(n), p or path))) for n, p in trail]
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": it["name"], "item": clean_url(it["path"].split("#")[0])}
        for i, it in enumerate(items)]}

def page(path, title, description, body, active, trail=None, schema=(), image="shop-exterior.jpg", robots="index, follow", canonical=True):
    root = "../" * path.count("/")
    graph = ([breadcrumb_schema(trail, path)] if trail else []) + list(schema)
    ld = ('<script type="application/ld+json">\n' + json.dumps({"@context": "https://schema.org", "@graph": graph}, indent=1, ensure_ascii=False) +
          "\n</script>\n") if graph else ""
    url = clean_url(path)
    canon = f'<link rel="canonical" href="{url}">\n<meta property="og:url" content="{url}">\n' if canonical else ""
    head = f"""<!DOCTYPE html>
<html lang="en" data-root="{root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description)}">
<meta name="robots" content="{robots}">
{canon}<meta property="og:type" content="website">
<meta property="og:site_name" content="Pronto Automotive">
<meta property="og:locale" content="en_CA">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(description)}">
<meta property="og:image" content="{BASE_URL}assets/{image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}css/styles.css">
<link rel="stylesheet" href="{root}css/components.css">
<link rel="stylesheet" href="{root}css/chat.css">
<link rel="stylesheet" href="{root}css/motion.css">
<link rel="icon" href="{root}assets/logo/favicon.svg" type="image/svg+xml">
{ld}</head>
<body>
"""
    body = body.replace("{crumbs}", crumbs_html(trail) if trail else "")
    doc = head + chrome(top, root, active) + '<main id="top">\n' + body.replace("{root}", root) + "\n</main>\n\n" + chrome(bottom, root, None) + "</body>\n</html>\n"
    target = SITE / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(doc, encoding="utf-8")
    return path

def meta_desc(text, limit=155):
    """Plain-text description cut at a word boundary so search snippets don't end mid-word."""
    text = html.unescape(text)
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "..."

def checks(items):
    return '<ul class="check-list">' + "".join(f"<li>{CHECK}<span>{i}</span></li>" for i in items) + "</ul>"

SERVICES = [
  dict(slug="oil-maintenance", alt="Pronto Automotive technician performing engine bay maintenance on a vehicle.", name="Oil &amp; Maintenance", book="Oil &amp; Maintenance", img="svc-maintenance.jpg",
       title="Oil Changes &amp; Vehicle Maintenance in Markham",
       lede="Regular maintenance is the simplest way to keep a vehicle safe, reliable and ready for Ontario weather. Whether you need an oil change or an engine change, we look after gas and diesel vehicles from light to heavy duty.",
       what="Engine oil protects moving parts from heat and wear, and filters keep dirt out of the engine, cabin and fuel system. Over time fluids break down and parts wear, so routine service catches small issues before they turn into expensive repairs.",
       signs=["Oil change or service reminder on the dash", "Engine running rougher or louder than usual", "Dark, gritty or low engine oil", "Due for a seasonal check before winter or a road trip"],
       includes=["Lube, oil &amp; filter service", "Tune-ups", "Coolant flush", "Brake fluid flush", "Power steering flush", "Transmission, transfer case &amp; differential service", "Fuel system &amp; intake cleaning", "Belt &amp; hose replacement"]),
  dict(slug="brakes", alt="Close-up of brake rotor and hub being serviced by a Pronto Automotive technician.", name="Brakes", book="Brakes", img="svc-brakes.jpg",
       title="Brake Repair &amp; Inspection in Markham",
       lede="Your brakes are the most important safety system on your vehicle. We inspect them carefully, explain what we find and replace only what actually needs replacing.",
       what="Brake pads press against rotors to slow the vehicle, and brake fluid carries the force from the pedal to each wheel. Pads and rotors wear with every stop, and brake fluid absorbs moisture over time, which reduces stopping power.",
       signs=["Squealing, grinding or scraping when braking", "Soft, spongy or sinking pedal", "Vehicle pulls to one side when stopping", "Brake or ABS warning light", "Vibration through the pedal or steering wheel"],
       includes=["Pad and rotor inspection and replacement", "Caliper and brake hardware service", "Brake fluid flush", "ABS diagnosis", "Brake systems for fleet and heavier-duty vehicles"]),
  dict(slug="diagnostics", alt="Pronto technician running computer diagnostics from inside a customer vehicle.", name="Diagnostics", book="Diagnostics", img="svc-diagnostics.jpg",
       title="Car &amp; Truck Diagnostics in Markham",
       lede="Diagnosis is where good repairs start. We specialize in finding the real cause of warning lights and hard-to-find problems on gasoline and diesel vehicles, so the right repair happens the first time.",
       what="Modern vehicles are run by computers that monitor the engine, transmission, brakes and electrical systems. A scan tool reads the fault codes they store, and an experienced technician uses that data with hands-on testing to pinpoint the actual problem instead of guessing.",
       signs=["Check engine or other warning light on", "Stalling, hesitation or rough running", "Starting or no-start problems", "Electrical faults, lighting or battery drain", "Poor fuel economy"],
       includes=["Computer diagnostics and fault code analysis", "Electrical and lighting diagnosis", "Starters, alternators, batteries and no-starts", "Emission testing", "A clear explanation before any repair"]),
  dict(slug="tires", alt="Technician selecting tires from the stocked tire racks at Pronto Automotive.", name="Tires", book="Tires", img="svc-tires.jpg",
       title="Tire Service in Markham",
       lede="Tires are the only part of your vehicle that touches the road. We help you choose the right tires, install and balance them properly, and keep them lined up so they wear evenly.",
       what="Tread depth, pressure, balance and alignment all affect grip, braking distance and how long tires last. In Ontario, seasonal tires make a real difference to safety when the weather turns.",
       signs=["Worn or uneven tread", "Vibration at highway speed", "Vehicle pulling to one side", "Frequent low tire pressure", "Time for a seasonal changeover"],
       includes=["Tire supply and installation", "Mounting and balancing", "Seasonal tire changeovers", "Wheel alignment", "Tires for cars, trucks and fleet vehicles"]),
  dict(slug="steering-suspension", alt="Underside vehicle inspection on a hoist at the Pronto Automotive shop.", name="Steering &amp; Suspension", book="Steering &amp; Suspension", img="svc-suspension.jpg",
       title="Steering, Suspension &amp; Alignment in Markham",
       lede="Your steering and suspension keep the vehicle stable, comfortable and in control. We diagnose clunks, pulls and rough rides, and get your vehicle tracking straight again.",
       what="Shocks, struts, bushings, ball joints and tie rods absorb bumps and keep your tires in contact with the road. When they wear, handling suffers, tires wear faster and braking distances can grow.",
       signs=["Clunking or knocking over bumps", "Vehicle pulls, drifts or wanders", "Bouncy or unusually rough ride", "Uneven tire wear", "Steering wheel off-centre or loose"],
       includes=["Shocks and struts", "Steering components and power steering service", "Wheel alignment", "Suspension and driveline repair", "Service for light to heavy-duty vehicles"]),
  dict(slug="engine-repair", alt="Technician working with a wrench on an engine during a repair at Pronto Automotive.", name="Engine Repair", book="Engine Repair", img="svc-engine-repair.jpg",
       title="Engine Repair in Markham",
       lede="From small leaks to major mechanical work, we repair gasoline and diesel engines on light to heavy-duty vehicles, with a clear explanation of what&rsquo;s needed before we begin.",
       what="Your engine relies on its cooling system, belts, hoses, pumps and sensors working together. Catching a leak, overheating issue or misfire early usually means a smaller repair and less time off the road.",
       signs=["Overheating or temperature gauge climbing", "Oil or coolant leaks", "Misfires, knocking or loss of power", "Smoke from the exhaust", "Check engine light"],
       includes=["Cooling systems and radiators", "Hoses, belts and pumps", "Gasoline and diesel engine repair", "Air conditioning and HVAC", "Exhaust repair", "Drive train and differential"]),
]

SERVICES += [
  dict(slug="air-conditioning", alt="Pronto Automotive technician working in a vehicle engine bay.", name="Air Conditioning &amp; Heating", book="Air Conditioning", img="svc-engine-repair.jpg",
       title="Car A/C &amp; Heating Repair in Markham",
       lede="From weak airflow in July to no heat in January, we diagnose and repair vehicle air conditioning and heating systems on cars, trucks and fleet vehicles.",
       what="Your A/C system uses a compressor, condenser and refrigerant to pull heat out of the cabin, while the heater borrows warm coolant from the engine. A small leak, a failing blend door or a tired compressor can leave you sweating or shivering, and a weak defroster is a real safety problem in an Ontario winter.",
       signs=["A/C blowing warm or only slightly cool", "Weak airflow from the vents", "Musty smell when the fan runs", "No heat or slow-to-warm heater", "Windows that won&rsquo;t defog", "Clicking or squealing when the A/C is on"],
       includes=["A/C performance check and diagnosis", "Leak detection and repair", "Compressor, condenser and component replacement", "Heater and blend door repair", "Cooling system and radiator service", "HVAC service for fleet vehicles"]),
  dict(slug="transmission", alt="Pronto Automotive technician performing drivetrain maintenance on a vehicle.", name="Transmission &amp; Drivetrain", book="Transmission", img="svc-maintenance.jpg",
       title="Transmission &amp; Drivetrain Service in Markham",
       lede="Smooth shifting and a healthy drivetrain keep your vehicle moving. We service transmissions, transfer cases and differentials on cars, SUVs, trucks and fleet vehicles.",
       what="Transmission fluid cools and lubricates the gears and clutches inside your transmission, and transfer cases and differentials have their own gear oil. Over time that fluid breaks down, and regular service costs far less than a rebuild. Four-wheel-drive and all-wheel-drive vehicles have extra drivetrain parts that need attention too.",
       signs=["Delayed, harsh or slipping shifts", "Whining, humming or clunking from underneath", "Transmission fluid leaks (reddish spots)", "Shuddering when accelerating", "Warning light or limp mode", "Due for scheduled transmission service"],
       includes=["Transmission fluid service", "Transfer case service", "Differential service", "Drive train and driveline repair", "CV axles and U-joints", "Diagnosis before any major repair"]),
  dict(slug="electrical-batteries", alt="Pronto technician running computer diagnostics from inside a customer vehicle.", name="Electrical &amp; Batteries", book="Electrical &amp; Batteries", img="svc-diagnostics.jpg",
       title="Auto Electrical &amp; Battery Repair in Markham",
       lede="A vehicle that won&rsquo;t start or keeps draining its battery is frustrating. We test the battery, starter and charging system and track down electrical faults properly.",
       what="Your battery starts the engine, and the alternator recharges it and powers everything while you drive. Cold Ontario winters are hard on batteries, and modern vehicles have dozens of electronic modules that can quietly drain power or trigger warning lights when a wire or sensor fails.",
       signs=["Slow cranking or clicking when you turn the key", "Battery keeps going dead", "Battery or charging warning light", "Dim or flickering lights", "Power windows, locks or accessories acting up", "Burning smell or blown fuses"],
       includes=["Battery testing and replacement", "Starters and alternators", "Charging system diagnosis", "Batteries and no-starts", "Lighting and electrical repair", "Accessory installations"]),
  dict(slug="exhaust", alt="Underside vehicle inspection on a hoist at the Pronto Automotive shop.", name="Exhaust &amp; Mufflers", book="Exhaust &amp; Mufflers", img="svc-suspension.jpg",
       title="Exhaust &amp; Muffler Repair in Markham",
       lede="A loud or leaking exhaust is more than an annoyance. We inspect and repair exhaust systems, mufflers and related emission parts on gas and diesel vehicles.",
       what="The exhaust system carries hot gases away from the engine and out from under the vehicle, quiets engine noise and cleans up emissions through the catalytic converter. Road salt and moisture rust exhaust parts over time, and a leak can let fumes into the cabin.",
       signs=["Louder than normal engine or rumbling noise", "Rattling from underneath the vehicle", "Exhaust smell inside the cabin", "Hanging or dragging exhaust pipe", "Check engine light related to emissions", "Drop in fuel economy"],
       includes=["Exhaust inspection", "Muffler and pipe repair or replacement", "Hangers, clamps and gaskets", "Catalytic converter diagnosis", "Emission testing", "Exhaust work on fleet and diesel vehicles"]),
  dict(slug="inspections", alt="The Pronto Automotive front counter and service desk, where customers are greeted.", name="Inspections", book="Pre-Purchase Inspection", img="reception.jpg",
       title="Pre-Purchase &amp; Safety Inspections in Markham",
       lede="Buying a used car or want peace of mind before a road trip? We put the vehicle on a hoist, check it thoroughly and walk you through what we find.",
       what="A pre-purchase inspection shows you a used vehicle&rsquo;s real condition before you hand over any money: brakes, tires, suspension, leaks, rust and warning codes. It can save you from a costly surprise or give you leverage to negotiate. We also perform safety inspections and annual inspections for fleet vehicles.",
       signs=["You&rsquo;re buying a used car or truck", "You&rsquo;re selling and want to know what to fix", "Heading out on a long road trip", "Your fleet vehicle is due for its annual inspection", "Something just doesn&rsquo;t feel right"],
       includes=["Pre-purchase inspections", "Safety inspections", "Annual fleet inspections", "Brake, tire and suspension checks", "Computer scan for stored fault codes", "A clear walk-through of what we find"]),
]

CALL = '<a href="tel:+19052949476" class="btn btn-outline btn-lg">Call 905-294-9476</a>'
AREAS = "Markham, Unionville, Scarborough and across York Region"

def service_schema(svc, path):
    return {"@type": "Service", "@id": clean_url(path) + "#service",
            "name": html.unescape(svc["title"]).replace(" in Markham", ""),
            "serviceType": html.unescape(svc["name"]), "url": clean_url(path),
            "description": html.unescape(svc["lede"]),
            "provider": {"@id": BUSINESS_ID},
            "areaServed": [{"@type": "City", "name": c} for c in ("Markham", "Unionville", "Scarborough")]}

def svc_card(s):
    href = f'{{root}}services/{s["slug"]}.html'
    return f"""
        <article class="svc-card">
          <div class="svc-photo"><img src="{{root}}assets/{s["img"]}" loading="lazy" width="760" height="535" alt="{s["alt"]}"></div>
          <div class="svc-body">
            <h3><a href="{href}">{s["name"]}</a></h3>
            <p>{s["lede"].split(". ")[0].rstrip(".")}.</p>
            <a href="{href}" class="txtlink">Learn more</a>
          </div>
        </article>"""

def hero(eyebrow, h1, lede, actions, media=None):
    """Page header; {crumbs} is filled in by page() from the trail."""
    intro = f"""
        {{crumbs}}
        <div class="eyebrow">{eyebrow}</div>
        <h1>{h1}</h1>
        <p class="lede">{lede}</p>
        <div class="hero-actions">
          {actions}
        </div>"""
    if not media:
        return f'\n  <section class="page-hero">\n    <div class="wrap">{intro}\n    </div>\n  </section>'
    return f"""
  <section class="page-hero">
    <div class="wrap page-hero-grid">
      <div>{intro}
      </div>
      <div class="page-hero-media">{media}</div>
    </div>
  </section>"""

BOOK = '<button class="btn btn-primary btn-lg" data-book>Book Service</button>\n          ' + CALL

written = []

# ---------- Service pages ----------
for svc in SERVICES:
    path = f'services/{svc["slug"]}.html'
    others = "".join(f'<li><a href="{{root}}services/{o["slug"]}.html"' + (' aria-current="page"' if o is svc else "") + f'>{o["name"]}</a></li>' for o in SERVICES)
    trail = [("Home", "index.html"), ("Services", "services.html"), (svc["name"], None)]
    book = html.unescape(svc["book"])
    body = hero("Our Services", svc["title"], svc["lede"],
        f'<button class="btn btn-primary btn-lg" data-book data-service="{book}">Book {svc["name"]}</button>\n          {CALL}',
        f'<img src="{{root}}assets/{svc["img"]}" width="760" height="535" alt="{svc["alt"]}">') + f"""

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
        <h2>{svc["name"]} near you</h2>
        <p>Pronto Automotive is an independent shop at 5833 Highway 7 East, serving drivers from <a href="{{root}}service-areas.html">{AREAS}</a> since 1979. We work on gas and diesel vehicles, from daily drivers to work trucks and <a href="{{root}}fleet.html">business fleets</a>. Have a question first? Check our <a href="{{root}}faq.html">FAQ</a> or <a href="{{root}}contact.html">contact the shop</a>.</p>
      </div>
      <aside class="aside-card">
        <h3>Need {svc["name"].lower()} service?</h3>
        <p>Send a request and a member of the Pronto team will contact you to confirm a time.</p>
        <button class="btn btn-primary" data-book data-service="{book}">Book Service</button>
        <a href="tel:+19052949476" class="btn btn-outline">Call 905-294-9476</a>
        <ul class="aside-links">{others}</ul>
      </aside>
    </div>
  </section>"""
    written.append(page(path, html.unescape(svc["title"]) + " | Pronto Automotive",
        meta_desc(svc["lede"]), body, None, trail, [service_schema(svc, path)], svc["img"]))

# ---------- Services hub ----------
EXTRA = ["Coolant flush", "Wheel alignment", "Belt &amp; hose replacement", "Brake flush", "Fuel system &amp; intake cleaning",
         "Lube, oil &amp; filter", "Power steering flush", "Tune-ups", "Windshield &amp; glass replacement",
         "Trailer hitches, towing &amp; accessories", "Emissions testing", "Used car purchase &amp; sales"]
body = hero("Our Services", "Auto Repair &amp; Maintenance Services in Markham",
    "Everything your car, truck or fleet needs under one roof, from oil changes and brakes to diagnostics and engine work, on gas and diesel vehicles.",
    BOOK) + f"""

  <section class="section">
    <div class="wrap">
      <div class="svc-grid">{"".join(svc_card(s) for s in SERVICES)}
      </div>
      <div class="svc-extra">
        <h3>We also offer</h3>
        <ul>{"".join(f"<li>{e}</li>" for e in EXTRA)}</ul>
      </div>
      <div class="svc-more">
        <a class="btn btn-outline btn-lg" href="{{root}}fleet.html">Fleet Services</a>
      </div>
    </div>
  </section>"""
written.append(page("services.html", "Auto Repair Services in Markham | Pronto Automotive",
    "Diagnostics, brakes, oil changes, tires, suspension, engine, A/C, transmission, electrical, exhaust and inspections for gas and diesel vehicles in Markham.",
    body, ("services.html", "Services"), [("Home", "index.html"), ("Services", None)],
    [{"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": clean_url(f'services/{s["slug"]}.html'),
      "name": html.unescape(s["name"])} for i, s in enumerate(SERVICES)]}], "svc-diagnostics.jpg"))

# ---------- Fleet ----------
FLEET_BODY = hero("Fleet Support", "Reliable Fleet Maintenance &amp; Repair",
    "Fleets large and small, local and nationwide, trust Pronto Automotive to keep their cars, trucks and trailers working. Let us take the burden of fleet maintenance off your plate.",
    f'<button class="btn btn-primary btn-lg" data-book data-service="Fleet Service">Talk About Your Fleet</button>\n          {CALL}',
    '<img src="{root}assets/fleet-service.jpg" width="1400" height="933" alt="Commercial vans and trucks lined up outside a fleet service garage.">') + f"""

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
      </aside>
    </div>
  </section>"""
written.append(page("fleet.html", "Fleet Maintenance & Repair in Markham | Pronto Automotive",
    "Fleet maintenance and repair for cars, trucks and trailers in Markham since 1979. Custom programs, free pick-up and delivery for most vehicles.",
    FLEET_BODY, ("fleet.html", "Fleet"), [("Home", "index.html"), ("Fleet Services", None)],
    [{"@type": "Service", "name": "Fleet Maintenance and Repair", "serviceType": "Fleet maintenance", "url": clean_url("fleet.html"),
      "provider": {"@id": BUSINESS_ID}, "areaServed": {"@type": "AdministrativeArea", "name": "York Region"}}], "fleet-service.jpg"))

# ---------- About ----------
REVIEWS = [("Everyone at Pronto was super friendly and helpful. They even walked me through key issues on the car while it was on the jack.", "Jonathan Carrigan"),
           ("The manager listened to explanation and didn&rsquo;t dismiss my observations&hellip; he didn&rsquo;t pressure me to fix them with any tactics. The price was fair.", "Minerva"),
           ("Helpful staff. Very clean reception area as well as garage", "Blair McIlmoyle")]
quotes = "".join(f'\n        <blockquote class="quote"><p>&ldquo;{q}&rdquo;</p><cite>{n}</cite></blockquote>' for q, n in REVIEWS)
body = hero("Since 1979", "About Pronto Automotive",
    "An independent Markham auto repair shop that has looked after local drivers, businesses and fleets for more than four decades.",
    BOOK, '<img src="{root}assets/shop-exterior.jpg" width="760" height="535" alt="Pronto Automotive shop exterior at 5833 Highway 7 East in Markham.">') + f"""

  <section class="section">
    <div class="wrap page-body">
      <div class="prose">
        <h2>Our story</h2>
        <p>Pronto Automotive has been serving Markham and the surrounding area since 1979. We specialize in the diagnosis and repair of gasoline and diesel vehicles, from light duty to heavy duty.</p>
        <p>Whether you need an oil change or an engine change, our goal is courteous, professional service of the highest calibre, and workmanship we&rsquo;re prepared to stand behind. We don&rsquo;t aim to be the cheapest shop in town. We aim to be the shop you count on.</p>
        <h2>What we believe</h2>
        <div class="feature-pair">
          <div><h3>The customer comes first</h3><p>Real people, practical advice and relationships that have kept Markham drivers coming back for decades.</p></div>
          <div><h3>We explain before we repair</h3><p>We diagnose properly, explain what we found in plain language, and nothing proceeds without your approval.</p></div>
          <div><h3>Experienced technicians</h3><p>Strong diagnostic capability on gas and diesel vehicles, backed by ongoing training and in-house service audits.</p></div>
          <div><h3>Work we stand behind</h3><p>If something isn&rsquo;t right, we work with you to make it right. We&rsquo;ll be by your side long after the repair.</p></div>
        </div>
        <h2>What we work on</h2>
        {checks(["Cars, SUVs and minivans", "Pickups and work trucks", "Gas and diesel engines", "Light to heavy-duty vehicles", "Trailers", "Local and nationwide fleets"])}
        <p style="margin-top:18px">See our full list of <a href="{{root}}services.html">auto repair services</a>, or learn about our <a href="{{root}}fleet.html">fleet programs</a>.</p>
        <h2>What customers say</h2>{quotes}
      </div>
      <aside class="aside-card">
        <h3>Visit the shop</h3>
        <p>5833 Highway 7 East, Markham, Ontario<br>Mon&ndash;Fri 8 AM&ndash;5 PM<br>Saturday 8 AM&ndash;12 PM</p>
        <button class="btn btn-primary" data-book>Book Service</button>
        <a href="{{root}}contact.html" class="btn btn-outline">Contact &amp; Directions</a>
      </aside>
    </div>
  </section>"""
written.append(page("about.html", "About Pronto Automotive | Markham Auto Repair Since 1979",
    "Independent Markham auto repair shop since 1979. Experienced technicians for gas and diesel cars, trucks and fleets, with honest advice and work we stand behind.",
    body, ("about.html", "About"), [("Home", "index.html"), ("About", None)],
    [{"@type": "AboutPage", "url": clean_url("about.html"), "about": {"@id": BUSINESS_ID}}]))

# ---------- Contact (reuses the homepage's location block) ----------
loc = home[home.index('<div class="loc-grid">'): home.index("<!-- ========== FINAL CTA")]
loc = loc[: loc.rindex("</section>")].rstrip()
loc = loc[: loc.rindex("</div>")].rstrip()  # drop the section's own .wrap close
body = hero("Visit Us", "Contact Pronto Automotive",
    f"Call the shop, send a service request or stop by. We&rsquo;re on Highway 7 East in Markham, serving drivers from {AREAS}.",
    '<button class="btn btn-primary btn-lg" data-book>Request an Appointment</button>\n          ' + CALL) + f"""

  <section class="section bg-soft">
    <div class="wrap">
      {loc.replace('<h2>Pronto Automotive</h2>', '<h2>Shop details</h2>', 1)}
    </div>
  </section>"""
written.append(page("contact.html", "Contact & Directions | Pronto Automotive Markham",
    "Pronto Automotive, 5833 Highway 7 East, Markham. Call 905-294-9476 or email info@prontomarkham.com. Open Mon-Fri 8-5, Sat 8-12.",
    body, ("contact.html", "Contact"), [("Home", "index.html"), ("Contact", None)],
    [{"@type": "ContactPage", "url": clean_url("contact.html"), "about": {"@id": BUSINESS_ID}}]))

# ---------- FAQ ----------
FAQS = [
  ("What are your hours?", "We&rsquo;re open Monday to Friday from 8:00 AM to 5:00 PM and Saturday from 8:00 AM to 12:00 PM. We&rsquo;re closed Sundays."),
  ("Where are you located?", 'We&rsquo;re at 5833 Highway 7 East in Markham, Ontario, serving drivers from Markham, Unionville, Scarborough and across York Region. See our <a href="{root}contact.html">contact page</a> for a map and directions.'),
  ("Do I need an appointment?", 'Booking ahead is the best way to get your vehicle in quickly. <button type="button" class="linklike" data-book>Send a request online</button> or call 905-294-9476. Your appointment is confirmed once a member of our team contacts you.'),
  ("Do you work on diesel vehicles and trucks?", "Yes. We specialize in the diagnosis and repair of gasoline and diesel vehicles, from light duty to heavy duty, including pickups, work trucks and trailers."),
  ("Will you do work without asking me first?", "No. We inspect the vehicle, explain what we found in plain language and walk you through your options. Nothing proceeds without your approval."),
  ("My check engine light is on. What should I do?", 'Book a <a href="{root}services/diagnostics.html">diagnostic appointment</a>. We read the stored fault codes and test the system to find the real cause, so you only pay for the repair you actually need. If the light is flashing or the engine is running badly, call us before driving further.'),
  ("Can you inspect a used car before I buy it?", 'Yes. A <a href="{root}services/inspections.html">pre-purchase inspection</a> puts the vehicle on a hoist so we can check brakes, tires, suspension, leaks and warning codes, then walk you through what we find.'),
  ("Do you do seasonal tire changeovers?", 'Yes. We supply, install and balance tires and handle seasonal changeovers for cars, trucks and fleet vehicles. See <a href="{root}services/tires.html">tire service</a>.'),
  ("Do you service business fleets?", 'Yes. Fleets large and small, local and nationwide, use Pronto for car, truck and trailer repair, with custom maintenance programs and free pick-up and delivery for most vehicles. Learn more on our <a href="{root}fleet.html">fleet page</a>.'),
  ("What payment methods do you accept?", "We accept Visa, Mastercard, American Express and Discover. We also work with fleet programs including PHH Fleet Management, Foss National Leasing and others."),
  ("How often should I change my oil?", 'It depends on your vehicle, the oil it uses and how you drive. Your owner&rsquo;s manual or the service reminder on your dash is the best guide, and we&rsquo;re happy to recommend a schedule. See <a href="{root}services/oil-maintenance.html">oil &amp; maintenance</a>.'),
]
faq_items = "".join(f'\n        <details class="faq"><summary>{q}</summary><div class="faq-a"><p>{a}</p></div></details>' for q, a in FAQS)
body = hero("Questions", "Frequently Asked Questions",
    "Quick answers about booking, hours, the vehicles we work on and how we handle repairs.", BOOK) + f"""

  <section class="section">
    <div class="wrap page-body">
      <div class="faq-list">{faq_items}
      </div>
      <aside class="aside-card">
        <h3>Still have a question?</h3>
        <p>Call the shop or send a request, and a member of the Pronto team will get back to you.</p>
        <button class="btn btn-primary" data-book>Book Service</button>
        <a href="tel:+19052949476" class="btn btn-outline">Call 905-294-9476</a>
      </aside>
    </div>
  </section>"""
def answer_text(a):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html.unescape(a))).strip()
written.append(page("faq.html", "Auto Repair FAQ | Pronto Automotive Markham",
    "Answers about hours, booking, diesel and truck repair, check engine lights, used car inspections, tires, fleets and payment at Pronto Automotive in Markham.",
    body, None, [("Home", "index.html"), ("FAQ", None)],
    [{"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": html.unescape(q),
      "acceptedAnswer": {"@type": "Answer", "text": answer_text(a)}} for q, a in FAQS]}]))

# ---------- Areas we serve ----------
AREA_TEXT = [
  ("Markham", "Our shop is on Highway 7 East in Markham, and we&rsquo;ve been fixing Markham drivers&rsquo; cars, trucks and fleet vehicles since 1979. Many of our customers have trusted us with their vehicles for decades."),
  ("Unionville", "Unionville drivers are a short trip along Highway 7 from our shop. From routine oil changes to diagnostics and brake work, we keep family vehicles and daily commuters on the road."),
  ("Scarborough", "Customers come up from Scarborough for honest advice and experienced technicians, especially for diesel work, hard-to-find electrical problems and pre-purchase inspections."),
  ("York Region businesses &amp; fleets", "Businesses across York Region rely on our fleet programs for car, truck and trailer repair, with free pick-up and delivery for most vehicles and service documentation for your records."),
]
area_sections = "".join(f"\n        <h2>Auto repair for {a}</h2>\n        <p>{t}</p>" for a, t in AREA_TEXT)
svc_links = "".join(f'<li>{CHECK}<span><a href="{{root}}services/{s["slug"]}.html">{s["name"]}</a></span></li>' for s in SERVICES)
body = hero("Service Area", "Auto Repair Serving Markham, Unionville &amp; Scarborough",
    "Pronto Automotive is an independent auto repair shop at 5833 Highway 7 East, serving drivers and businesses across Markham, Unionville, Scarborough and York Region.",
    BOOK, '<img src="{root}assets/shop-exterior.jpg" width="760" height="535" alt="Pronto Automotive shop exterior on Highway 7 East in Markham.">') + f"""

  <section class="section">
    <div class="wrap page-body">
      <div class="prose">{area_sections}
        <h2>Popular services</h2>
        <ul class="check-list">{svc_links}</ul>
      </div>
      <aside class="aside-card">
        <h3>Find the shop</h3>
        <p>5833 Highway 7 East<br>Markham, Ontario</p>
        <a class="btn btn-primary" href="https://www.google.com/maps/search/?api=1&amp;query=5833+Highway+7+East+Markham+Ontario" target="_blank" rel="noopener noreferrer">Get Directions</a>
        <a href="tel:+19052949476" class="btn btn-outline">Call 905-294-9476</a>
      </aside>
    </div>
  </section>"""
written.append(page("service-areas.html", "Auto Repair Near Markham, Unionville & Scarborough | Pronto",
    "Trusted auto repair for Markham, Unionville, Scarborough and York Region since 1979. Gas and diesel cars, trucks and fleets at 5833 Highway 7 East.",
    body, None, [("Home", "index.html"), ("Areas We Serve", None)]))

# ---------- 404: without it the host answers unknown URLs with the homepage and a 200 ----------
page("404.html", "Page Not Found | Pronto Automotive", "Page not found.", hero("Page not found",
    "Sorry, we couldn&rsquo;t find that page", "The page may have moved. Try one of these instead, or call the shop at 905-294-9476.",
    '<a class="btn btn-primary btn-lg" href="{root}index.html">Back to Home</a>\n          <a class="btn btn-outline btn-lg" href="{root}services.html">All Services</a>'),
    None, robots="noindex", canonical=False)
# It is served at any depth, so every local link must be site-absolute.
f404 = SITE / "404.html"
t = f404.read_text(encoding="utf-8").replace('data-root=""', 'data-root="/"')
t = re.sub(r'(href|src)="(?!https?:|tel:|mailto:|#|/)([^"]+)"', r'\1="/\2"', t)
t = re.sub(r'"/index\.html', '"/', t)
t = re.sub(r'(href="/[^"#]*)\.html', r"\1", t)
f404.write_text(t, encoding="utf-8")

urls = ["index.html"] + written
(SITE / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"  <url><loc>{clean_url(u)}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(SITE / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}sitemap.xml\n", encoding="utf-8")
print("wrote:", ", ".join(written), "+ 404.html, sitemap.xml, robots.txt")
