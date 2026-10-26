@ui
Feature: Splash screen (top of the landing page)

  Background:
    * driver baseUrl + '/home'
    * def hero = 'section:first-of-type'
    * waitFor(hero)

  Scenario: The splash shows the app name, tagline and mission
    * match text(hero + ' h1') == 'Eco 5.0'
    * match text(hero) contains 'Prepare. Save. Protect.'
    * match text(hero) contains 'Your community. Your climate. Your future.'

  Scenario: Log in takes a returning visitor to the login page
    * waitFor(hero + " a[href='/login']")
    When click(hero + " a[href='/login']")
    Then waitForUrl('/login')

  Scenario: Get started takes a new visitor to the sign-up page
    # The button appears once the session check (GET /api/auth/me) has answered.
    * waitFor('{a}Get started')
    When click('{a}Get started')
    Then waitForUrl('/register')
    And waitForText('h1', 'Create an account')

  Scenario: Explore Features scrolls down to the features section on the same page
    * match attribute('{a}Explore Features', 'href') == '#features'
    When click('{a}Explore Features')
    Then waitForUrl('/home#features')
    # The section's top should now be near the top of the window.
    And retry until script("Math.abs(document.getElementById('features').getBoundingClientRect().top) < 150")

  Scenario: The hero has a background photo, or its green fallback
    # The photo is decorative (Photo's `background` prop), so screen readers
    # skip it: it is an <img alt=""> when it loads, or an aria-hidden box when
    # it fails. Either way there is exactly one of them.
    * def photo = locateAll(hero + " img, " + hero + " div[aria-hidden='true']")
    * match photo == '#[1]'
    * def decorative = photo[0].attribute('alt') == '' || photo[0].attribute('aria-hidden') == 'true'
    * match decorative == true

  Scenario: The splash buttons are stacked and big enough to tap on a phone
    * driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    * waitFor('{a}Get started')
    * def start = position('{a}Get started')
    * def explore = position(hero + " a[href='/login']")
    # match compares values; assert is for any true/false expression like > or <.
    * assert explore.y > start.y
    * assert start.height >= 44
