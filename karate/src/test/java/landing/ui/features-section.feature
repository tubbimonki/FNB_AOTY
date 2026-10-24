@ui
Feature: "Our Features" section

  Background:
    * driver baseUrl + '/home'
    * waitFor('#features')

  Scenario: The section has its heading and intro text
    * match text('#features h2') == 'Our Features'
    * match text('#features p') == '#string'

  Scenario: It lists the five features by name
    * def names = scriptAll('#features li strong', '_.textContent.trim()')
    * match names == ['Climate Data Tracker:', 'Interactive Educational Modules:', 'News & Updates:', 'Water Purification Guides:', 'Environmental Benefits Explained:']

  Scenario: Every feature has a description after its name
    * def items = scriptAll('#features li', '_.textContent')
    * match each items == '#regex .+:\\s+\\S.+'
