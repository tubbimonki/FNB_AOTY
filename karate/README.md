# Karate test kit

End-to-end tests written in [Karate](https://docs.karatelabs.io/). They drive a
real Chrome against the running app (`npm run dev`) and call the real Express
API (`npm run api`). The Vitest tests in `src/` stay as they are: Vitest checks
components on their own in a fake browser, Karate checks the whole app the way
a visitor sees it.

| File | What it covers |
| --- | --- |
| `api/health.feature` | `GET /api/health` on Express and through the Vite proxy, speed, unknown routes |
| `api/events.feature` | events list and details, attending earns the reward and cancelling takes it back, reactions toggle and earn 2 points, both need a login |
| `api/news.feature` | `GET /api/news` always answers with stories that link to their real source |
| `api/auth.feature` | logout revokes the token (a copied cookie is refused), safety headers |
| `api/modules.feature` | `GET /api/features`, sample data from each module, server-side footprint, reports need a login |
| `ui/routing.feature` | `/` redirects to `/home`, header/main/footer landmarks, the 404 page |
| `ui/header.feature` | desktop: logo, the five tabs, active tab (Eco stays lit on `/tracker`), Log in, Home bounce to login, tab bar hidden |
| `ui/mobile-menu.feature` | phone width: bottom tab bar, five tabs, stuck to the bottom, tap to navigate, 44px tap targets, hidden on the splash, no sideways scroll |
| `ui/hero.feature` | splash: app name and tagline, Get started and Log in, the `#features` jump, decorative photo or fallback, stacked buttons on phones |
| `ui/pages.feature` | every Eco 5.0 page opens with its title, `/impact` and the report form need a login, checklist survives a reload, logging water fills the ring |
| `ui/features-section.feature` | heading and the five features |
| `ui/guides-section.feature` | news card and guides card each link 3 items into the dashboard, side-by-side vs stacked layout |
| `ui/benefits-section.feature` | heading and the four benefits |
| `ui/footer.feature` | copyright lines, the About / Features / Benefits links and where they go, `API: ok`, `API: offline` with a faked dead API, footer on other pages |
| `ui/motion.feature` | cards below the fold wait and fade in when scrolled to (`data-reveal`), nothing on screen is ever hidden, every feature card opens its tool |
| `ui/wide-screen.feature` | at 2560px the Eco page fills the width and adds quick tools, Services shows water tools on the Water tab; a 1366px laptop is unchanged |
| `ui/images.feature` | every photo described or marked decorative, fallback box when photos fail, every Unsplash URL in `images.js` is live (`@network`) |
| `mocks/*.feature` | fake responses used by the footer and image tests (tagged `@ignore`, never run on their own) |

## Setup (once)

1. **Java 17 or newer.** Check with `java -version`. If it's missing, install
   Temurin 21 from https://adoptium.net (tick "Set JAVA_HOME" in the installer).
2. **Maven.** Check with `mvn -v`. If it's missing:
   `winget install Apache.Maven` in PowerShell, or download from
   https://maven.apache.org/download.cgi, unzip, and add its `bin` folder to PATH.
   Open a new terminal afterwards.
3. **Google Chrome**, installed normally. Karate finds it by itself.

The first `mvn test` downloads Karate (about 60 MB), so it takes a minute.

## Running it

Three terminals, all in the project folder:

```powershell
npm run api          # terminal 1: Express on :4000
npm run dev          # terminal 2: Vite on :5173
cd karate
mvn test             # terminal 3: the whole kit
```

Then open `karate/target/karate-reports/karate-summary.html`. Every step is
listed with its result, and failed UI steps have a screenshot attached.

Useful variations:

```powershell
mvn test "-Dkarate.options=--tags @api"          # only the API checks (no browser)
mvn test "-Dkarate.options=--tags @mobile"       # only the phone tab bar
mvn test "-Dkarate.options=--tags ~@network"     # skip the internet check on photos
mvn test "-Dkarate.options=classpath:landing/ui/hero.feature"   # one file
mvn test -Dheadless=false                        # watch Chrome do it
mvn test -DbaseUrl=http://localhost:5174         # if Vite picked another port
mvn test "-DchromePath=C:\path\to\chrome.exe"    # if Chrome isn't found
```

`karate/target/` is build output; it's gitignored.

## How Karate works (the short version)

**Gherkin.** Each `.feature` file is plain text: a `Feature:` title, an optional
`Background:` that runs before every scenario, then `Scenario:` blocks. Each line
starts with `Given`, `When`, `Then`, `And` or `*`. To Karate these keywords all
mean the same thing; they are only there to make the test read like a story
(set up, act, check). We use `*` for setup lines and the words where they help.

**Every line is a Karate step, not English.** Unlike Cucumber, there is no Java
"glue" code behind the steps. `url`, `path`, `method get`, `status 200`,
`match`, `def`, `assert` are built-in keywords, and anything else on a `*` line
is JavaScript (`click('{a}Log in')`, `driver.emulateDevice(...)`). That is why
Karate tests need no code beside the features.

**`match` is the heart of it.** `match a == b` deep-compares JSON, lists or text
and prints a diff when they differ. Fuzzy markers keep tests from being brittle:
`'#string'` (any text), `'#[4]'` (a list of 4), `'#regex .+\\.'`,
`'#? _ > 0'` (any JS check, `_` is the value). `match each` applies one rule to
every item. `match` only does equality-style checks, so for `>` and `<` use
`assert`.

**API tests** (`api/health.feature`) build a request with `url` and `path`, send
it with `method get`, then check `status`, headers and `response`.

**UI tests** start Chrome with `driver <url>`. Elements are found with
*locators*: CSS (`#main-nav`), XPath (`//nav//a`), or Karate's friendly ones,
`{a}Log in` meaning "the `<a>` whose text is exactly *Log in*". Then:
`click()`, `text()`, `attribute()`, `exists()`, `position()`, `scriptAll()`
(run JS on every match). Because a React page renders after the HTML arrives,
waits matter: `waitFor`, `waitForUrl`, `waitForText` and `retry until` keep
polling instead of failing on the first try.

**Mocks and intercepts.** `driver.intercept(...)` catches browser requests that
match a URL pattern and answers them from a mock feature instead of the
network. That is how `footer.feature` sees the "offline" message without you
stopping the API, and how `images.feature` proves broken photos turn into the
green fallback.

**Config.** `src/test/java/karate-config.js` runs before every scenario and
returns shared variables (`baseUrl`, `apiUrl`, `phone`, `desktop`) and the
browser settings. `-Dname=value` on the command line overrides them.

**Tags** (`@ui`, `@api`, `@mobile`, `@network`, `@ignore`) let you run slices,
and `~@tag` means "everything except".

**Scenario Outline** in `footer.feature` runs the same steps once per row of
the `Examples:` table, with `<label>` and `<path>` filled in from each row.

## Your turn

- Add `ui/tracker.feature` for the Green Wallet page: pick an action, log it,
  check today's totals change, reload and check they're still there
  (that tests the localStorage part, which Vitest can't do end to end).
- When the sign-up page is done, add a feature that registers a user, logs in,
  reaches `/dashboard`, and logs out. Use a random email per run
  (`* def email = 'test' + java.lang.System.currentTimeMillis() + '@example.com'`)
  so reruns don't clash.
- When Climate News gets a real API, intercept it with a mock feature so the
  test doesn't depend on the outside service.
