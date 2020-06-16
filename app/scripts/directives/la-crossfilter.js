'use strict';

/**
 * @ngdoc directive
 * @name locationAnalyticsApp.directive:laLeafletMap
 * @description
 * # laLeafletMap
 */
angular.module('locationAnalyticsApp')
  .directive('laCrossfilter', function () {
    return {
      //template: '<div id="crossfilter" flex></div>',
      templateUrl: 'views/debug.html',
      restrict: 'E',
      scope: {
        selectedview: '=',
        statsloading: '=',
        showall: '=',
        showheatmap: '='
      },
      controller: function ($scope, ApiService, $timeout, CrossfilterService, $rootScope) {

        

        $rootScope.$watch("selectedDates", function(){
          console.log("selected dates", $rootScope.selectedDates);
          if ($scope.selectedview.isSelected)
            updateView($scope.selectedview.viewId, $rootScope.selectedDates);
        }, true);


        $scope.allViewData = [];
        $scope.dataLoading = false;

        //$rootScope.resetCharts = $scope.resetCharts;

        //renderView("57cecef763e5282d0d000402");

        $scope.$watch("selectedview", function () {

          if ($scope.selectedview.isSelected)
            updateView($scope.selectedview.viewId, $rootScope.selectedDates);
          //console.log($scope.selectedview);
        });

        $rootScope.$watch("crossfilterLoading", function () {
          $scope.dataLoading = $rootScope.crossfilterLoading;
        });


        function updateView(view_id, selectedDates) {
          //console.log("VIEWID", view_id);
          CrossfilterService.update(view_id, $scope.resetCharts, selectedDates);

          /*
           if ($scope.allViewData.hasOwnProperty(view_id)) {

           renderView(view_id, $scope.allViewData[view_id]);
           } else {




           var dates = [
           "2015-03-01T11%3A00&end-date=2015-03-07T20%3A00",
           "2015-03-08T11%3A00&end-date=2015-03-14T20%3A00",
           "2015-03-15T11%3A00&end-date=2015-03-21T20%3A00"
           ]


           $scope.dataLoading = true;
           var loader = $interval(function () {
           var date = dates.pop();
           $scope.dataLoading = false;
           ApiService.getAllDailyVisitorsByViewId(view_id, date).then(function (data) {

           $scope.allViewData[view_id] = data;
           renderView(view_id, data);
           });
           if(dates.length === 0)
           $interval.cancel(loader);
           }, 10000);


           }
           */

        }


        function renderView(view_id, data) {

          $scope.resetCharts();


          console.log(data);
          var viewRawData = data.rows;

          if (viewRawData.length == 0)
            return console.log("No entry found");


          CrossfilterService.update(data);


        }


        function updateViewData(selectedViews) {

          $timeout(function () {

            var sum = 0;
            for (var i = 0; i < selectedViews.length; i++) {
              //for(var j = 0; j < selectedViews[i].values)
              sum = sum + selectedViews[i].values[0].count;
            }


            $scope.selectedview.viewData.sum = sum;


          }, 1);


        }

      },
      link: function postLink(scope, element, attrs) {

        var chartSkeleton = '<div id="date-chart" class="chart"> <div class="title">Date</div> </div> ' +
          '<div id="hour-chart" class="chart"> <div class="title">Time of Day</div> </div>';

        scope.resetCharts = function () {

          console.log("resetting chart");
          var myEl = angular.element(element[0].querySelector('#charts'));
          myEl.html(chartSkeleton);
        };

        //console.log("MYELEMENT", element[0].querySelector('#charts'));

      }
    };
  });
