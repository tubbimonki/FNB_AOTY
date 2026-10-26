@ui
Feature: "Useful Guides & Solutions" section (news card + guides card)

  Both cards are teasers: they list real headlines and guide titles from the
  same data the dashboard uses, and link into the members' pages.

  Background:
    * driver baseUrl + '/home'
    * waitFor('#guides')

  Scenario: The section heading is shown
    * match text('#guides h2') == 'Useful Guides & Solutions'

  Scenario: It holds the two cards, news and guides
    * def cardTitles = scriptAll('#guides .card h3', '_.textContent.trim()')
    * match cardTitles == ['Latest Climate News', 'Useful Guides & Solutions']

  Scenario: The news card links the top three headlines to the news page
    * def hrefs = scriptAll('#guides .card:nth-of-type(1) li a', "_.getAttribute('href')")
    * match hrefs == '#[3]'
    * match each hrefs == '#regex /dashboard/news#news-.+'

  Scenario: The guides card links the three newest guides to the guides page
    * def guides = locateAll('#guides .card:nth-of-type(2) li a')
    * match guides == '#[3]'
    * def hrefs = karate.map(guides, function(a){ return a.attribute('href') })
    * match each hrefs == '#regex /dashboard/guides#guide-.+'
    * match each karate.map(guides, function(a){ return a.text }) == '#regex .{10,}'

  Scenario: The cards sit side by side on desktop and stack on a phone
    * driver.emulateDevice(desktop.width, desktop.height, desktop.userAgent)
    * def tops = scriptAll('#guides .card', '_.getBoundingClientRect().top')
    * match tops[0] == tops[1]
    * driver.emulateDevice(phone.width, phone.height, phone.userAgent)
    * def tops = scriptAll('#guides .card', '_.getBoundingClientRect().top')
    * assert tops[1] > tops[0]
