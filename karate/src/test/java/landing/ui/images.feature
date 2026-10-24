@ui
Feature: Landing page photos

  Background:
    * driver baseUrl + '/home'
    * waitFor('main')

  Scenario: Every photo on the page has alt text
    # A photo is either a loaded <img alt> or Photo.jsx's fallback box with aria-label.
    * def labels = scriptAll('img, [role=img]', "_.getAttribute('alt') || _.getAttribute('aria-label')")
    * match labels == '#[_ > 0]'
    * match each labels == '#? _ && _.length > 0'

  Scenario: No broken-image icons: a failed photo becomes the green fallback box
    # Make every Unsplash request fail, then check Photo.jsx swapped in its fallback.
    * driver.intercept({ patterns: [{ urlPattern: '*images.unsplash.com*' }], mock: 'classpath:landing/mocks/images-broken.feature' })
    * refresh()
    * waitFor("section [role=img][aria-label='Tall trees in a dense green forest']")
    * match exists('section img') == false
    # The hero photo is a background, so its fallback hides the alt text.
    * match text('section [role=img]') == ''

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
