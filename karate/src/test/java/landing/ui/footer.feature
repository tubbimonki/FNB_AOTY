@ui
Feature: Footer, the info-page links and the API status line

  The footer holds the links to About, Features and Benefits (the tabs are kept
  for the app itself) and asks GET /api/health when the page loads, then shows the
  answer. The API scenarios need the API running (npm run api) except the
  offline one, which fakes a dead API with Karate's request intercept.

  Background:
    * driver baseUrl + '/home'
    * waitFor('footer')

  Scenario: The footer shows the copyright and support lines
    * match text('footer') contains '© 2026 Eco 5.0. All rights reserved.'
    * match text('footer') contains 'Support organizations working on climate solutions.'

  Scenario: The info pages are linked from the footer, in order
    * def labels = scriptAll('footer li a', '_.textContent.trim()')
    * match labels == ['About', 'Features', 'Benefits']
    * def links = scriptAll('footer li a', "_.getAttribute('href')")
    * match links == ['/about', '/features', '/benefits']

  Scenario Outline: The <label> link opens <path>
    When click("footer a[href='<path>']")
    Then waitForUrl('<path>')
    And waitForText('main h1', '<heading>')

    Examples:
      | label    | path      | heading                                    |
      | About    | /about    | About                                      |
      | Features | /features | Our Features                               |
      | Benefits | /benefits | Communal Benefits of a Healthy Environment |

  Scenario: With the API running, the footer says API: ok
    * waitForText('footer', 'API: ok')

  Scenario: With the API down, the footer says offline
    # intercept sends matching browser requests to a mock feature instead of the network.
    * driver.intercept({ patterns: [{ urlPattern: '*/api/health*' }], mock: 'classpath:landing/mocks/api-down.feature' })
    * refresh()
    * waitForText('footer', 'API: offline (run npm run api)')

  Scenario: The footer is on every page, not just home
    Given driver baseUrl + '/about'
    Then waitForText('footer', 'All rights reserved')
