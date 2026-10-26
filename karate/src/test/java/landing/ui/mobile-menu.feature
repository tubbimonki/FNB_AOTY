@ui @mobile
Feature: Phone tab bar (phone-width window)

  Below 1024px the header is hidden and a tab bar sits at the bottom of the
  screen, like a native app. It is hidden on the splash and login screens.

  Background:
    * driver baseUrl + '/eco'
    * driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    * def tabBar = "nav[aria-label='Tabs']"
    * waitFor(tabBar)

  Scenario: The tab bar shows the five tabs and the header is hidden
    # The bar is position: fixed, so check its display (offsetParent is always null for fixed elements).
    * match script(tabBar, "_.ownerDocument.defaultView.getComputedStyle(_).display") != 'none'
    * def labels = scriptAll(tabBar + ' a', '_.textContent.trim()')
    * match labels == ['Home', 'Map', 'Eco', 'Community', 'More']
    * match script('header', "_.ownerDocument.defaultView.getComputedStyle(_).display") == 'none'

  Scenario: The tab bar is stuck to the bottom of the screen
    * def box = script(tabBar, '_.getBoundingClientRect().bottom')
    * assert Math.abs(box - phone.height) < 2

  Scenario: Tapping a tab navigates and marks it as current
    When click(tabBar + " a[href='/map']")
    Then waitForUrl('/map')
    And waitForText('h1', 'Community Map')
    And match attribute(tabBar + " a[href='/map']", 'aria-current') == 'page'
    And match attribute(tabBar + " a[href='/eco']", 'aria-current') == null

  Scenario: Every tab is big enough to tap (44px)
    * def heights = scriptAll(tabBar + ' a', '_.getBoundingClientRect().height')
    * match each heights == '#? _ >= 44'

  Scenario: The splash screen has no tab bar
    Given driver baseUrl + '/home'
    And waitFor('h1')
    Then match exists(tabBar) == false

  Scenario Outline: <path> does not scroll sideways on a phone
    Given driver baseUrl + '<path>'
    And waitFor('h1')
    * def fitsScreen = script('document.documentElement.scrollWidth <= window.innerWidth')
    Then match fitsScreen == true

    Examples:
      | path           |
      | /home          |
      | /eco           |
      | /alerts        |
      | /eco/recycling |
