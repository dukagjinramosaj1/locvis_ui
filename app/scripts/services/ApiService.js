'use strict';


angular.module('locationAnalyticsApp')
  .service('ApiService', [
    '$rootScope',
    '$http',
    '$q',
    'CacheService',
    function ApiService($rootScope, $http, $q, CacheService) {

      //var API_URL = "http://localhost:3000/api/v1/";
      var API_URL = "http://ec2-52-57-225-73.eu-central-1.compute.amazonaws.com:3000/api/v1/";
      var API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJfaWQiOiI1" +
        "ODBkZGE3NmRhYTc1OTU1YjJiMjU0YzMiLCJ2aWV3cyI6W10sInZlbnVlcyI6W119.8jcSNmWPQ6BIJBgNPKcWG_dZu6Hbs_jjXdwc3Q_5-vc";

      return {
        getZones: getZones,
        getViews: getViews,
        getAllVisitorsByViewId: getAllVisitorsByViewId,
        getAllDailyVisitorsByViewId: getAllDailyVisitorsByViewId,
        getChordMatrix: getOverallChordMatrix,
        getAllDailyVisitorsForMultipleViewIds: getAllDailyVisitorsForMultipleViewIds,
        getOverallChordMatrixByDateAndViewId: getOverallChordMatrixByDateAndViewId
      };


      function getZones() {

        var parameter = {
          url: API_URL + 'zones',
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + API_KEY
          }
        };

        return $q(function (resolve, reject) {
          $http(parameter).then(function successCallback(response) {
            resolve(response.data)
          }, function errorCallback(response) {
            reject(response.data);
          });
        });


      }

      function getViews() {

        var parameter = {
          url: API_URL + 'views',
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + API_KEY
          }
        };

        return $q(function (resolve, reject) {
          $http(parameter).then(function successCallback(response) {
            resolve(response.data)
          }, function errorCallback(response) {
            reject(response.data);
          });
        });


      }

      function getAllVisitorsByViewId(viewId) {
        var query = 'data?viewId=' + viewId + '&start-date=2013-01-19T11%3A00&end-date=2016-12-01T20%3A00&dimensions=dateYear%2CallVisitors&metrics=count';
        //console.log(query);
        var parameter = {
          url: API_URL + query,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + API_KEY
          }
        };

        return $q(function (resolve, reject) {

          $http(parameter).then(function successCallback(response) {
            if(Object.keys(response.data).length == 1)
              response.data = response.data[Object.keys(response.data)[0]];
            resolve(response.data)
          }, function errorCallback(response) {
            reject(response.data);
          });

        });

      }

      function getAllDailyVisitorsByViewId(viewId, dateRange) {
        var query = 'data?viewId=' + viewId + '&start-date=' + dateRange[0] + '&end-date=' + dateRange[1] + '&dimensions=dateDay,timeHour%2CallVisitors&metrics=count';
        //console.log(query);
        var parameter = {
          url: API_URL + query,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + API_KEY
          }
        };

        return $q(function (resolve, reject) {

          $http(parameter).then(function successCallback(response) {
            //Api response changed
            if(Object.keys(response.data).length == 1)
              response.data = response.data[Object.keys(response.data)[0]];
            resolve(response.data)

          }, function errorCallback(response) {
            reject(response.data);
          });

        });

      }

      function getAllDailyVisitorsForMultipleViewIds(viewId, dateRange) {

        var viewIdString = "";

        

       

        return $q(function (resolve, reject) {
          var cacheData = CacheService.getDailyVisitors(viewId);
          console.log("CACHE IS", cacheData);

          if(cacheData["hit"] && cacheData["reViewIds"].length === 0){
            console.log("CACHE FOUND");
            resolve(cacheData["data"]);
            return 0;
          }

          if(cacheData["hit"])
            viewId = cacheData["reViewIds"];

            for (var i = 0; i < viewId.length; i++) {
              viewIdString = viewIdString + viewId[i].viewId;
              if(i != viewId.length-1)
                viewIdString = viewIdString + ",";
            };


            var query = 'data?viewId=' + viewIdString + '&start-date=' + dateRange[0] + '&end-date=' + dateRange[1] + '&dimensions=dateDay,timeHour%2CallVisitors&metrics=count';
              //var query = "data?viewId=57cecef763e5282d0d000402,57cecef763e5282d0d0003ec,57cecef763e5282d0d0003ec&start-date=2013-07-01T11%3A00&end-date=2016-07-03T20%3A00&dimensions=dateDay,timeHour%2CallVisitors&metrics=count"
              //console.log(query);
              var parameter = {
                url: API_URL + query,
                method: 'GET',
                headers: {
                  'Authorization': 'Bearer ' + API_KEY
                }
            };
            $http(parameter).then(function successCallback(response) {

              CacheService.cacheData("dailyVisitors", response.data);

              if(cacheData["hit"])
                response.data = CacheService.extend(response.data, cacheData["data"]);
              
              resolve(response.data)

            }, function errorCallback(response) {
              reject(response.data);
            });
          

        });

      }

      function getOverallChordMatrixByDateAndViewId(viewId, dateRange){
           var viewIdString = "";
            for (var i = 0; i < viewId.length; i++) {
              viewIdString = viewIdString + viewId[i].viewId;
              if(i != viewId.length-1)
                viewIdString = viewIdString + ",";
            };
            var query = 'data?viewId=' + viewIdString + '&start-date=' + dateRange[0] + '&end-date=' + dateRange[1] + '&dimensions=dateDay%2CodMatrix&metrics=odMatrixCountAgg';
            //var query = "data?viewId=57cecef763e5282d0d000402,57cecef763e5282d0d0003ec,57cecef763e5282d0d0003ec&start-date=2013-07-01T11%3A00&end-date=2016-07-03T20%3A00&dimensions=dateDay,timeHour%2CallVisitors&metrics=count"
            console.log(query);
            var parameter = {
              url: API_URL + query,
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + API_KEY
              }
            };

            return $q(function (resolve, reject) {

              $http(parameter).then(function successCallback(response) {
                 var res = {};
                if(response.data){
                  var o = 1;
                  for(var id in response.data){
                    if(id.indexOf(",") > -1){
                      console.log("onur", id.slice(-24));
                      res[id.slice(-24)] = response.data[id];
                    }else{
                      res[id] = response.data[id];
                    }
                    o = o + 1;
                  }
                }else{
                  res = response.data
                }
                //CacheService.cacheData("odMatrix", res);
                resolve(res)

              }, function errorCallback(response) {
                reject(response.data);
              });

            });
      }


      function getOverallChordMatrix(){
        var query = 'data?viewId=&start-date=&end-date=&dimensions=dateDay%2CodMatrix&metrics=odMatrixCountAgg';
        //console.log(query);
        var parameter = {
          url: API_URL + query,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + API_KEY
          }
        };

        return $q(function (resolve, reject) {

          $http(parameter).then(function successCallback(response) {
            resolve(response.data)
          }, function errorCallback(response) {
            reject(response.data);
          });

        });
      }

    }]);
