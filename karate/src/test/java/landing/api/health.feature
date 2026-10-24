@api
Feature: API health check (what the footer's "API:" line asks for)

  The footer calls GET /api/health on every page load. These scenarios check
  that endpoint directly on Express, and through the Vite proxy the browser uses.

  Scenario: Express answers the health check with status ok
    Given url apiUrl
    And path 'health'
    When method get
    Then status 200
    And match header Content-Type contains 'application/json'
    And match response == { status: 'ok' }

  Scenario: The Vite dev server forwards /api/health to Express
    # This is the exact URL the browser fetches, so if it fails the footer says offline.
    Given url baseUrl
    And path 'api', 'health'
    When method get
    Then status 200
    And match response.status == 'ok'

  Scenario: The health check is fast
    Given url apiUrl
    And path 'health'
    When method get
    Then status 200
    # responseTime is in milliseconds. A slow health check makes the footer flicker on "checking...".
    And assert responseTime < 1000

  Scenario: An unknown API route is a 404, not a crash
    Given url apiUrl
    And path 'does-not-exist'
    When method get
    Then status 404
