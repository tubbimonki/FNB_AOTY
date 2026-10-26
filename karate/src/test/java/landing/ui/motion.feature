@ui
Feature: Soft fade-ins and hover touches (motion and nature design)

  useScrollReveal hides cards below the fold (data-reveal="wait") and lets
  them rise in once they scroll into view (data-reveal="in").

  Background:
    * driver baseUrl + '/home'
    * waitFor('#benefits')

  Scenario: Cards further down wait, then fade in when scrolled to
    * def benefit = '#benefits li:first-child'
    * match attribute(benefit, 'data-reveal') == 'wait'
    * script(benefit, "_.scrollIntoView({ block: 'center' })")
    * retry until attribute(benefit, 'data-reveal') == 'in'

  Scenario: Things already on screen are never hidden
    # The splash (the first section on the page) is visible at load, so
    # nothing in it waits for a scroll.
    * match exists("(//section)[1]//*[@data-reveal='wait']") == false

  Scenario: Every feature card opens its tool
    * def hrefs = scriptAll('#features li a', "_.getAttribute('href')")
    * match hrefs == ['/alerts', '/map', '/services', '/eco', '/eco/recycling']
    When click("#features a[href='/map']")
    Then waitForUrl('/map')
