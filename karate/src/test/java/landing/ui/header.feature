@ui
Feature: Desktop header and navigation

  From lg (1024px) up the header shows the logo, the five tabs from the
  Eco 5.0 design (Home, Map, Eco, Community, More) and the account button.
  On phones the header is hidden and the bottom tab bar takes over: see
  mobile-menu.feature. The info pages (About, Features, Benefits) are in the
  footer: see footer.feature.

  Background:
    * driver baseUrl + '/home'
    * driver.emulateDevice(desktop.width, desktop.height, desktop.userAgent)
    * waitFor('#main-nav')

  Scenario: The logo links back to the home page
    * def logo = "header a[href='/home']"
    * match text(logo) contains 'Eco 5.0'
    When click(logo)
    Then waitForUrl('/home')

  Scenario: The nav has the five tabs, in order
    # scriptAll runs a bit of JavaScript on every match; _ is the element.
    * def labels = scriptAll('#main-nav li a', '_.textContent.trim()')
    * match labels == ['Home', 'Map', 'Eco', 'Community', 'More']
    * def links = scriptAll('#main-nav li a', "_.getAttribute('href')")
    * match links == ['/dashboard', '/map', '/eco', '/community', '/more']

  Scenario: No tab is marked active on the landing page
    * def current = scriptAll('#main-nav li a', "_.getAttribute('aria-current')")
    * match each current == null

  Scenario: On desktop the header shows and the phone tab bar does not
    # offsetParent is null for anything hidden with display: none.
    * def headerShown = script('#main-nav', '_.offsetParent != null')
    * match headerShown == true
    * driver baseUrl + '/eco'
    * waitFor("nav[aria-label='Tabs']")
    # position: fixed, so check display instead of offsetParent.
    * match script("nav[aria-label='Tabs']", "_.ownerDocument.defaultView.getComputedStyle(_).display") == 'none'

  Scenario: A logged-out visitor sees a Log in button
    * click("header a[href='/login']")
    * waitForUrl('/login')
    * waitForText('main h1', 'Log in')

  Scenario: Eco opens Eco-Impact and becomes the active tab
    When click("#main-nav a[href='/eco']")
    Then waitForUrl('/eco')
    And waitForText('h1', 'Eco-Impact')
    And match attribute("#main-nav a[href='/eco']", 'aria-current') == 'page'
    And match attribute("#main-nav a[href='/map']", 'aria-current') == null

  Scenario: Eco stays active on its sub-pages, like Green Wallet
    Given driver baseUrl + '/tracker'
    And waitForText('h1', 'Green Wallet')
    Then match attribute("#main-nav a[href='/eco']", 'aria-current') == 'page'

  Scenario: Home is members-only, so a visitor lands on the login page
    When click("#main-nav a[href='/dashboard']")
    Then waitForUrl('/login')
