@ui
Feature: Landing page routing

  Background:
    * driver baseUrl + '/home'
    * waitFor('header')

  Scenario: The site root redirects to /home
    Given driver baseUrl + '/'
    Then waitForUrl('/home')
    And match driver.title == '#string'
    And match text('main h2') == 'Our Features'

  Scenario: The landing page has the three page landmarks
    # header, main and footer let screen readers jump straight to each part.
    * match exists('header') == true
    * match exists('main') == true
    * match exists('footer') == true

  Scenario: An unknown address shows the not-found page with a way back
    Given driver baseUrl + '/this-page-does-not-exist'
    Then waitForText('main', 'Page not found')
    When click('{a}Back to home')
    Then waitForUrl('/home')
