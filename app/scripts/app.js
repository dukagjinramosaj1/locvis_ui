'use strict';

/**
 * @ngdoc overview
 * @name locationAnalyticsApp
 * @description
 * # locationAnalyticsApp
 *
 * Main module of the application.
 */
angular
  .module('locationAnalyticsApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngMaterial',

  ])
  .config(function ($routeProvider, $mdIconProvider) {

    

    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/debug', {
        templateUrl: 'views/debug.html',
        controller: 'DebugCtrl',
        controllerAs: 'main'
      })
      .when('/chord', {
        templateUrl: 'views/choard.html',
        controller: 'ChoardCtrl',
      })
      .when('/crossfilter', {
        templateUrl: 'views/crossfilter.html',
        controller: 'CrossfilterCtrl',
      })
      .when('/chart', {
        templateUrl: 'views/chart.html',
        controller: 'ChartCtrl',
      })
      .otherwise({
        redirectTo: '/'
      });

    
  });
