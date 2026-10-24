@ui
Feature: Hero banner (top of the landing page)

  Background:
    * driver baseUrl + '/home'
    * def hero = 'section:first-of-type'
    * waitFor(hero)

  Scenario: The hero shows the headline and welcome text
    * match text(hero + ' h2') == 'Protecting Our Planet for Future Generations'
    * match text(hero + ' p') contains 'central hub for climate awareness'

  Scenario: Open Green Wallet goes to the tracker
    When click('{a}Open Green Wallet')
    Then waitForUrl('/tracker')
    And waitForText('h2', 'Green Wallet')

  Scenario: Explore Features jumps to the features section on the same page
    * match attribute('{a}Explore Features', 'href') == '#features'
    When click('{a}Explore Features')
    Then waitForUrl('/home#features')
    # The section's top should now be near the top of the window.
    And retry until script("Math.abs(document.getElementById('features').getBoundingClientRect().top) < 150")

  Scenario: The hero has a background photo, or its green fallback
    # Photo.jsx renders <img alt> when the photo loads and a role="img" box when it fails.
    * def photo = locateAll(hero + ' img, ' + hero + ' [role=img]')
    * match photo == '#[1]'
    * def label = photo[0].attribute('alt') || photo[0].attribute('aria-label')
    * match label == 'Tall trees in a dense green forest'

  Scenario: The hero buttons are full width and stacked on a phone
    * driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    * def wallet = position('{a}Open Green Wallet')
    * def explore = position('{a}Explore Features')
    # match compares values; assert is for any true/false expression like > or <.
    * assert explore.y > wallet.y
    * assert wallet.height >= 44
