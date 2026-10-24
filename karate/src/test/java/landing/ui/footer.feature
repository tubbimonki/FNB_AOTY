@ui
Feature: Footer and the API status line

  The footer asks GET /api/health when the page loads and shows the answer.
  These scenarios need the API running (npm run api) except the offline one,
  which fakes a dead API with Karate's request intercept.

  Background:
    * driver baseUrl + '/home'
    * waitFor('footer')

  Scenario: The footer shows the copyright and support lines
    * match text('footer') contains '© 2026 Climate Awareness App. All rights reserved.'
    * match text('footer') contains 'Support organizations working on climate solutions.'

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
