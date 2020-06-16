'use strict';

describe('Directive: laLeafletMap', function () {

  // load the directive's module
  beforeEach(module('locationAnalyticsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<la-leaflet-map></la-leaflet-map>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the laLeafletMap directive');
  }));
});
