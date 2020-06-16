'use strict';

describe('Directive: laChordDiagramm', function () {

  // load the directive's module
  beforeEach(module('locationAnalyticsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<la-chord-diagramm></la-chord-diagramm>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the laChordDiagramm directive');
  }));
});
