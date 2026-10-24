@ui
Feature: "Useful Guides & Solutions" section (news card + guides card)

  Background:
    * driver baseUrl + '/home'
    * waitFor('#guides')

  Scenario: The section heading is shown
    * match text('#guides h2') == 'Useful Guides & Solutions'

  Scenario: It holds the two cards, news and guides
    * def cardTitles = scriptAll('#guides .card h3', '_.textContent.trim()')
    * match cardTitles == ['Latest Climate News', 'Useful Guides & Solutions']

  Scenario: The news card says the feed is coming later
    * match text('#guides .card:nth-of-type(1)') contains 'News feed will be integrated here later'

  Scenario: The guides card links to three guides
    * def guides = locateAll('#guides .card li a')
    * match guides == '#[3]'
    * def hrefs = karate.map(guides, function(a){ return a.attribute('href') })
    * match hrefs == ['#water-purification', '#reduce-metal-pollution', '#environmental-benefits']
    * match each karate.map(guides, function(a){ return a.text }) == '#regex .{10,}'

  Scenario: The cards sit side by side on desktop and stack on a phone
    * driver.emulateDevice(desktop.width, desktop.height, desktop.userAgent)
    * def tops = scriptAll('#guides .card', '_.getBoundingClientRect().top')
    * match tops[0] == tops[1]
    * driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    * def tops = scriptAll('#guides .card', '_.getBoundingClientRect().top')
    * assert tops[1] > tops[0]
