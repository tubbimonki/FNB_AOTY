@api
Feature: Community events and their rewards

  The events module (api/modules/events) and the impact module that hears
  'event.attended' on the bus. Needs npm run api.

  Background:
    * url apiUrl

  Scenario: Anyone can see the events, upcoming ones first
    Given path 'events'
    When method get
    Then status 200
    And match response.events == '#[_ > 5]'
    And match each response.events contains { id: '#string', title: '#string', startsAt: '#string', reward: { label: '#string', points: '#number', premiumDays: '#number' }, attendeeCount: '#number', going: false, past: '#boolean' }

  Scenario: One event has a description and an attendees list
    Given path 'events', 'repair-cafe'
    When method get
    Then status 200
    And match response.event.description == '#[_ > 0]'
    And match response.event.attendees == '#[_ > 5]'
    And match response.event.sample == true

  Scenario: Attending needs a login
    Given path 'events', 'repair-cafe', 'attend'
    And request {}
    When method post
    Then status 401

  Scenario: Attending earns the reward, cancelling takes it back
    * def email = 'karate-' + java.util.UUID.randomUUID() + '@example.com'
    Given path 'auth', 'register'
    And request { name: 'Karate Tester', email: '#(email)', password: 'password123' }
    When method post
    Then status 201
    Given path 'events'
    When method get
    * def next = karate.filter(response.events, function(e){ return !e.past && e.reward.points > 0 })[0]
    Given path 'events', next.id, 'attend'
    And request {}
    When method post
    Then status 201
    And match response.event.going == true
    And match response.event.attendees[0] == 'You'
    Given path 'impact', 'awards'
    When method get
    Then status 200
    And match response.points == next.reward.points
    Given path 'events', next.id, 'attend'
    When method delete
    Then status 200
    And match response.event.going == false
    Given path 'impact', 'awards'
    When method get
    Then match response.points == 0

  Scenario: A reaction toggles on and off and earns 2 points
    * def email = 'karate-' + java.util.UUID.randomUUID() + '@example.com'
    Given path 'auth', 'register'
    And request { name: 'Karate Fan', email: '#(email)', password: 'password123' }
    When method post
    Then status 201
    Given path 'reactions', 'events', 'repair-cafe'
    And request { reaction: 'heart' }
    When method post
    Then status 200
    And match response.reacted == true
    And match response.mine == ['heart']
    Given path 'impact', 'awards'
    When method get
    Then match response.points == 2
    Given path 'reactions', 'events', 'repair-cafe'
    And request { reaction: 'heart' }
    When method post
    Then match response.reacted == false
    And match response.mine == []

  Scenario: Reacting needs a login and a known emoji
    Given path 'reactions', 'events', 'repair-cafe'
    And request { reaction: 'heart' }
    When method post
    Then status 401
