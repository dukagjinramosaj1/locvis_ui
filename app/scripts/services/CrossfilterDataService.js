'use strict';


angular.module('locationAnalyticsApp')
  .service('CrossfilterDataService', [
    '$rootScope',
    'ApiService',
    '$q',
    function CrossfilterDataService($rootScope, ApiService, $q) {



      function getBuffder(selectedRange){

        console.log(selectedRange);

      }


      function getDataForRange(dateRange){
        return ApiService.getAllDailyVisitorsByViewId()

      }


      return {
        getBuffer: getBuffder
      }





    }]);
