@ui
Feature: Landing page photos

  Background:
    * driver baseUrl + '/home'
    * waitFor('main')

  Scenario: Every photo on the page is either described or marked decorative
    # A photo is a loaded <img> or Photo.jsx's fallback box. A content photo
    # carries alt / aria-label text; a decorative one (the hero background)
    # has alt="" or aria-hidden, which tells screen readers to skip it.
    # What is never allowed is an <img> with no alt attribute at all.
    * def described = scriptAll('img, [role=img]', "_.hasAttribute('alt') || _.hasAttribute('aria-label')")
    * match described == '#[_ > 0]'
    * match each described == true

  Scenario: No broken-image icons: a failed photo becomes the green fallback box
    # Make every Unsplash request fail, then check Photo.jsx swapped in its fallback.
    * driver.intercept({ patterns: [{ urlPattern: '*images.unsplash.com*' }], mock: 'classpath:landing/mocks/images-broken.feature' })
    * refresh()
    * def fallback = "section:first-of-type div[aria-hidden='true']"
    * waitFor(fallback)
    * match exists('section img') == false
    # The hero photo is a background, so its fallback is hidden from screen readers and shows no text.
    * match text(fallback) == ''

  @network
  Scenario: Every Unsplash photo in images.js is reachable
    # Reads src/assets/images.js as text and pulls out the photo ids, so new
    # photos are checked without editing this file. Needs internet.
    * def source = karate.readAsString('file:../src/assets/images.js')
    * def ids = karate.extractAll(source, "unsplash\\('(photo-[^']+)'", 1)
    * match ids == '#[_ > 0]'
    * def check =
      """
      function(id) {
        var res = karate.http('https://images.unsplash.com/' + id + '?w=200').get();
        return { id: id, status: res.status, type: res.header('content-type') };
      }
      """
    * def results = karate.map(ids, check)
    * match each results contains { status: 200, type: '#regex image/.*' }
