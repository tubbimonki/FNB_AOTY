@ui
Feature: "Communal Benefits" section

  Background:
    * driver baseUrl + '/home'
    * waitFor('#benefits')

  Scenario: The section heading and intro are shown
    * match text('#benefits h2') == 'Communal Benefits of a Healthy Environment'
    * match text('#benefits p') contains 'These benefits include'

  Scenario: It lists the four benefits
    * def items = scriptAll('#benefits li', '_.textContent.trim()')
    * match items == '#[4]'
    * match items contains 'Enhanced biodiversity and ecosystem resilience.'
    * match each items == '#regex .+\\.'
