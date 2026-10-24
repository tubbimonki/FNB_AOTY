@ui
Feature: Header and desktop navigation

  On a desktop-width window (lg and up) the nav links sit in one row and
  the menu button is hidden. The phone layout is in mobile-menu.feature.

  Background:
    * driver baseUrl + '/home'
    * driver.emulateDevice(desktop.width, desktop.height, desktop.userAgent)
    * waitFor('#main-nav')

  Scenario: The logo links back to the home page
    * def logo = "header a[href='/home']"
    * match exists(logo) == true
    * match text(logo) contains 'Climate Change Awareness App'
    When click(logo)
    Then waitForUrl('/home')

  Scenario: The nav shows every page, in order
    # scriptAll runs a bit of JavaScript on every match; _ is the element.
    * def labels = scriptAll('#main-nav li a:not(.btn)', '_.textContent.trim()')
    * match labels == ['Home', 'Green Wallet', 'Dashboard', 'About', 'Features', 'Climate News', 'Guides & Solutions', 'Environmental Benefits']
    * def links = scriptAll('#main-nav li a:not(.btn)', "_.getAttribute('href')")
    * match links == ['/home', '/tracker', '/dashboard', '/about', '/features', '/news', '/guides', '/benefits']

  Scenario: The current page's tab is marked as active
    # NavLink adds aria-current="page" to the link for the current route.
    * match attribute('{a}Home', 'aria-current') == 'page'
    * match attribute('{a}About', 'aria-current') == null

  Scenario: On desktop the links are visible and the menu button is not
    # offsetParent is null for anything hidden with display: none.
    * def navShown = script('#main-nav', '_.offsetParent != null')
    * def buttonShown = script("button[aria-controls='main-nav']", '_.offsetParent != null')
    * match navShown == true
    * match buttonShown == false

  Scenario: A logged-out visitor sees a Log in button
    * match exists('{a}Log in') == true
    * click('{a}Log in')
    * waitForUrl('/login')
    * waitForText('main', 'Log in')

  Scenario Outline: Clicking <label> opens <path>
    When click('{a}<label>')
    Then waitForUrl('<path>')
    And waitForText('h2', '<heading>')
    And match attribute('{a}<label>', 'aria-current') == 'page'

    Examples:
      | label                  | path      | heading                                    |
      | Green Wallet           | /tracker  | Green Wallet                               |
      | About                  | /about    | About                                      |
      | Features               | /features | Our Features                               |
      | Climate News           | /news     | Latest Climate News                        |
      | Guides & Solutions     | /guides   | Useful Guides & Solutions                  |
      | Environmental Benefits | /benefits | Communal Benefits of a Healthy Environment |

  Scenario: Dashboard is members-only, so a visitor lands on the login page
    When click('{a}Dashboard')
    Then waitForUrl('/login')
