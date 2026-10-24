@ignore
Feature: Mock: every photo fails to load

  # Used by images.feature through driver.intercept.

  Scenario:
    * def responseStatus = 404
    * def response = 'not found'
