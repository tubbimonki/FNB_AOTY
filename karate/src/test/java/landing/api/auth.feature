@api
Feature: Sessions end for real on logout, and every answer has the safety headers

  Logout revokes the token on the server (revoked_tokens), so a copy of the
  session cookie (another tab, a stolen one) stops working too.

  Background:
    * url apiUrl

  Scenario: A copy of the session cookie is refused after logout
    * def email = 'karate-' + java.util.UUID.randomUUID() + '@example.com'
    Given path 'auth', 'register'
    And request { name: 'Karate Tester', email: '#(email)', password: 'password123' }
    When method post
    Then status 201
    * def copy = responseCookies.session.value
    Given path 'auth', 'me'
    And cookie session = copy
    When method get
    Then status 200
    Given path 'auth', 'logout'
    And request {}
    When method post
    Then status 204
    Given path 'auth', 'me'
    And cookie session = copy
    When method get
    Then status 401
    And match response.error contains 'log in again'

  Scenario: Answers carry the safety headers
    Given path 'health'
    When method get
    Then status 200
    And match header X-Content-Type-Options == 'nosniff'
    And match header X-Frame-Options == 'DENY'
    And match header Referrer-Policy == 'strict-origin-when-cross-origin'
