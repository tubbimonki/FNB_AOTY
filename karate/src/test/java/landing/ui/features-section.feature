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
    * match names == ['Weather & Climate Alerts:', 'Community Map:', 'Essential Services:', 'Eco-Impact & Green Wallet:', 'Recycling & Water Guides:']

  Scenario: Every feature has a description after its name
    * def items = scriptAll('#features li', '_.textContent')
    * match each items == '#regex .+:\\s+\\S.+'
