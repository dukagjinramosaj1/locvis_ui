'use strict';


angular.module('locationAnalyticsApp')
  .service('CacheService', [
    '$rootScope',
    function DataService($rootScope) {

      $rootScope.cacheData = {
        dailyVisitors: {},
        odMatrix: {}
      };

      return {
        getDailyVisitors: getDailyVisitors,
        cacheData: cacheData,
        extend: extend
      }


      function cacheData(dataType, data){
        for(var viewId in data){
          console.log("Caching " + viewId);
          $rootScope.cacheData[dataType][viewId] = data[viewId];
        }
        console.log("Cached ", $rootScope.cacheData[dataType]);
      }


      function getDailyVisitors(viewId){
        var response = {
          hit: false,
          data: {},
          reViewIds: [] // viewIds with no cache hit
        };

        for(var i = 0; i < viewId.length; i++){
          console.log("LOOKING FOR CACHE", $rootScope.cacheData["dailyVisitors"]);
          if($rootScope.cacheData["dailyVisitors"].hasOwnProperty(viewId[i].viewId)){
            response["hit"] = true;
            response["data"][viewId[i].viewId] = $rootScope.cacheData["dailyVisitors"][viewId[i].viewId];
          }else{
            response["reViewIds"].push(viewId[i]);
          }
        }

        return response;
      }

      function extend(obj, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
      }
    

    }]);
