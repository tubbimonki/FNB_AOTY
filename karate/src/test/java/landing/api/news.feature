@api
Feature: Climate news (GET /api/news)

  Live stories from RSS feeds, or the bundled real stories when no feed answers.
  Either way every story links to its real source.

  Scenario: The news route always answers with linked stories
    Given url apiUrl
    And path 'news'
    When method get
    Then status 200
    And match response.source == '#? ["live", "stale", "snapshot"].includes(_)'
    And match response.items == '#[_ > 4]'
    And match each response.items contains { title: '#string', source: '#string', url: '#regex https?://.+' }

  Scenario: South African stories come first
    Given url apiUrl
    And path 'news'
    When method get
    Then status 200
    And match response.items[0].region == 'za'
