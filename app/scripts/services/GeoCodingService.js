/**
 * Created by Dukagjin on 11/21/2016.
 */
'use strict';


angular.module('locationAnalyticsApp')
  .service('GeoCodingService', [
    '$rootScope',
    '$http',
    '$q',
    function GeoCodingService($rootScope, $http, $q) {

      var API_URL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
      var API_KEY = "AIzaSyBLkJtSUW5_43G52-C6B6XXWAVvMNHxUaY";

      return {
        getCoordinates: getCoordinates,

      };

      function getCoordinates(input){

        var  parameter = {
          url: API_URL + input + "&key=" + API_KEY,
          method: 'GET'

        };

        return $q(function (resolve, reject) {
          $http(parameter).then(function successCallback(response) {
            resolve(response.data)
          }, function errorCallback(response) {
            reject(response.data);
          });
        });

      };

    }]);
