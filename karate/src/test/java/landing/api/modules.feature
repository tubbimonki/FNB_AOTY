@api
Feature: Feature modules on the Express API

  The feature modules in api/modules. Needs npm run api.

  Background:
    * url apiUrl

  Scenario: GET /api/features lists the modules that are on
    Given path 'features'
    When method get
    Then status 200
    And match response.on == ['alerts', 'community', 'events', 'reactions', 'services', 'eco', 'wallet', 'impact']

  Scenario Outline: GET <route> answers with sample data
    Given path '<route>'
    When method get
    Then status 200
    And match response.sample == true

    Examples:
      | route              |
      | community/pins     |
      | community/updates  |
      | services/status    |

  Scenario: The footprint is worked out on the server
    Given path 'eco', 'footprint'
    And request { kwhPerMonth: 0, carKmPerWeek: 0, busKmPerWeek: 0, flightsPerYear: 0, diet: 'vegan' }
    When method post
    Then status 200
    And match response.total == 1.1

  Scenario: Sending a report without logging in is refused
    Given path 'community', 'reports'
    And request { category: 'water', description: 'Burst pipe' }
    When method post
    Then status 401

  Scenario: A logged-in user's Green Wallet log is saved in the database
    * def email = 'karate-' + java.util.UUID.randomUUID() + '@example.com'
    Given path 'auth', 'register'
    And request { name: 'Karate', email: '#(email)', password: 'password123' }
    When method post
    Then status 201
    * def logId = java.util.UUID.randomUUID() + ''
    Given path 'wallet', 'logs'
    And request { id: '#(logId)', actionId: 'cold-wash', date: '2026-10-25' }
    When method post
    Then status 201
    Given path 'wallet', 'logs'
    When method get
    Then status 200
    And match response.logs == [{ id: '#(logId)', actionId: 'cold-wash', date: '2026-10-25' }]
    Given path 'impact', 'me'
    When method get
    Then status 200
    And match response.points == 10

  Scenario Outline: <route> needs a login
    Given path '<route>'
    When method get
    Then status 401

    Examples:
      | route              |
      | wallet/logs        |
      | eco/water/logs     |
      | eco/footprint/mine |
      | alerts/checklist   |

  Scenario: Every service tab says whether it is live
    Given path 'services', 'status'
    When method get
    Then status 200
    And match response.live == '#array'
    And match response.services.electricity.message !contains 'stage'

  Scenario: Facilities need a place
    Given path 'services', 'facilities'
    And param lat = 'abc'
    And param lon = '28.05'
    When method get
    Then status 400

  Scenario: Alerts say which sources are live, and label sample data
    Given path 'alerts'
    And params { lat: '-26.1', lon: '28.23', place: 'Kempton Park' }
    When method get
    Then status 200
    And match response.alerts == '#[]'
    And match response.sources == { weather: '#string', power: '#string', air: '#string', saws: '#string' }
    And match response.sample == '#boolean'
    * def bad = karate.filter(response.alerts, function(a){ return !a.title || !/^(severe|warning|info)$/.test(a.severity) })
    * match bad == []
    * def unlabelled = karate.filter(response.alerts, function(a){ return response.sample && a.source != 'Sample data' })
    * match unlabelled == []

  Scenario: Alerts need a place
    Given path 'alerts'
    When method get
    Then status 400
