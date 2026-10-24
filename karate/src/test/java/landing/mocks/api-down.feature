@ignore
Feature: Mock: the API is down

  # Used by footer.feature through driver.intercept. Every request it gets
  # answers 503, the way a stopped server behind a proxy would.

  Scenario:
    * def responseStatus = 503
    * def response = { error: 'API offline (mock)' }
