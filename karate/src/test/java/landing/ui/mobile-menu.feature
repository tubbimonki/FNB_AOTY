@ui @mobile
Feature: Mobile menu (phone-width window)

  Below 1024px the nav links hide behind the ☰ button. The button tells
  screen readers what it does with aria-label and aria-expanded.

  Background:
    * driver baseUrl + '/home'
    * driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    * def menuButton = "button[aria-controls='main-nav']"
    * def navVisible = function(){ return script('#main-nav', '_.offsetParent !== null') }
    * waitFor(menuButton)

  Scenario: The menu starts closed
    * match navVisible() == false
    * match attribute(menuButton, 'aria-expanded') == 'false'
    * match attribute(menuButton, 'aria-label') == 'Open menu'

  Scenario: The short logo text is used on phones
    * match text("header a[href='/home']") contains 'Climate App'

  Scenario: Tapping the button opens the menu, tapping again closes it
    When click(menuButton)
    Then match navVisible() == true
    And match attribute(menuButton, 'aria-expanded') == 'true'
    And match attribute(menuButton, 'aria-label') == 'Close menu'
    When click(menuButton)
    Then match navVisible() == false

  Scenario: Tapping a link navigates and closes the menu
    Given click(menuButton)
    When click('{a}Green Wallet')
    Then waitForUrl('/tracker')
    And match navVisible() == false

  Scenario: Every link in the open menu is big enough to tap (44px)
    Given click(menuButton)
    * def heights = scriptAll('#main-nav a', '_.getBoundingClientRect().height')
    * match each heights == '#? _ >= 44'
    * def buttonHeight = script(menuButton, '_.getBoundingClientRect().height')
    * assert buttonHeight >= 44

  Scenario: The page does not scroll sideways on a phone
    * def fitsScreen = script('document.documentElement.scrollWidth <= window.innerWidth')
    * match fitsScreen == true
