'use strict';


angular.module('locationAnalyticsApp')
  .service('DataService', [
    '$rootScope',
    'ApiService',
    '$q',
    function DataService($rootScope, ApiService, $q) {

      return {
        getAllViews: getAllViews
      };

      function getAllViews() {

        return $q(function (resolve, reject) {
          ApiService.getZones().then(function (zoneData) {
            ApiService.getViews().then(function (viewData) {

              var viewAndZoneData = addViewToZone(zoneData, viewData);
              resolve(viewAndZoneData);

            })
          })
        });
      }

      function addViewToZone(zoneData, viewData){
        var i, j;

        for (i = 0; i < zoneData.length; i++) {
          for (j = 0; j < viewData.length; j++) {
            if (viewData[j].zone_arr[0] == zoneData[i].id) {
              zoneData[i].viewId = viewData[j]._id;
            }
          }
        }
        return zoneData;
      }

    }]);
