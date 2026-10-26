@ui
Feature: Eco 5.0 pages open and show their title bar

  Every page from the design opens without an account (except the two that
  need one) and shows its green title bar with the page name.

  Scenario Outline: <path> shows "<title>"
    Given driver baseUrl + '<path>'
    And driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    Then waitForText('h1', '<title>')

    Examples:
      | path           | title                    |
      | /alerts        | Weather & Climate Alerts |
      | /map           | Community Map            |
      | /community     | Community                |
      | /services      | Essential Services       |
      | /eco           | Eco-Impact               |
      | /eco/footprint | Carbon Footprint         |
      | /eco/water     | Water Usage              |
      | /eco/recycling | Recycling & Waste Guide  |
      | /more          | More                     |

  Scenario Outline: <path> needs a login
    Given driver baseUrl + '<path>'
    Then waitForUrl('/login')

    Examples:
      | path              |
      | /impact           |
      | /community/report |

  Scenario: The emergency checklist remembers a tick after a reload
    # Start clean on another page: Chrome's profile keeps localStorage between runs.
    Given driver baseUrl + '/home'
    And script('localStorage.clear()')
    And driver baseUrl + '/alerts'
    And waitFor('#checklist input[type=checkbox]')
    When click('#checklist input[type=checkbox]')
    And refresh()
    And waitFor('#checklist input[type=checkbox]')
    Then match script('#checklist input[type=checkbox]', '_.checked') == true
    And match text('#checklist') contains '1 of 7 done'

  Scenario: Logging water fills the ring
    # Start clean on another page: Chrome's profile keeps localStorage between runs.
    Given driver baseUrl + '/home'
    And script('localStorage.clear()')
    And driver baseUrl + '/eco/water'
    And waitFor("//button[contains(., 'Toilet flush')]")
    When click("//button[contains(., 'Toilet flush')]")
    * def ring = script("section[aria-label^='Today']", '_.textContent')
    Then match ring contains '9 L'
    And match ring contains '91 L remaining'

  Scenario: An event from the Community carousel opens its own page
    Given driver baseUrl + '/community'
    And driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    When waitFor("//div[@aria-label='Upcoming events']//a").click()
    Then waitForText('h1', 'Event')
    And waitFor("//section[@aria-labelledby='reward-title']")
    And match text("//section[@aria-labelledby='reward-title']") contains 'Reward for going'
    And match text('main') contains "Who's going"
    And match text('main') contains 'Log in to attend'

  Scenario: The alerts page says where its alerts come from
    Given driver baseUrl + '/alerts'
    When waitForAny(["//ul[@aria-label='Alert sources']", "//p[contains(., 'not real alerts')]", "//p[contains(., 'only forecast warnings')]"])
    Then match text('main') !contains 'Load shedding'
