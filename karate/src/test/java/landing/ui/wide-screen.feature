@ui
Feature: Wide desktop screens use the extra width

  From 1536px (Tailwind's 2xl) the content column grows with the screen and
  pages add quick widgets beside the related content. Laptops keep the old
  1152px column and no extra widgets.

  Scenario: On a 2560px screen the Eco page fills the width and adds quick tools
    Given driver baseUrl + '/eco'
    And driver.emulateDevice(2560, 1392, desktop.userAgent)
    Then waitFor("[aria-label='Quick tools']")
    And match text("[aria-label='Quick tools']") contains 'Water today'
    And match text("[aria-label='Quick tools']") contains 'Recycling'
    # The page column is now much wider than the old 1152px cap...
    * def width = script("Math.round(document.querySelector('main').getBoundingClientRect().width)")
    And assert width > 2000
    # ...and nothing sticks out sideways.
    And match script('document.documentElement.scrollWidth') == 2560

  Scenario: On a 1366px laptop nothing changes
    Given driver baseUrl + '/eco'
    And driver.emulateDevice(1366, 768, desktop.userAgent)
    And waitForText('h1', 'Eco-Impact')
    Then match exists("[aria-label='Quick tools']") == false
    * def width = script("Math.round(document.querySelector('main').getBoundingClientRect().width)")
    And assert width <= 1152

  Scenario: Services shows the water tools on the Water tab
    Given driver baseUrl + '/services'
    And driver.emulateDevice(1920, 1080, desktop.userAgent)
    Then waitFor("[aria-label='Water tools']")
    And match text("[aria-label='Water tools']") contains 'Water today'
