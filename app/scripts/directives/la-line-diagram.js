'use strict';

/**
 * @ngdoc directive
 * @name locationAnalyticsApp.directive:laLeafletMap
 * @description
 * # laLeafletMap
 */
angular.module('locationAnalyticsApp')
  .directive('laLineDiagram', function () {
    return {
      templateUrl: 'views/line-diagram.tmpl.html',
      restrict: 'E',
      scope: {
        config: '=',
        datadimension: '='
      },
      controller: function ($scope, ApiService, $timeout, CrossfilterService, $rootScope) {


        $scope.$watch('datadimension', function(){
          console.log($scope.datadimension);

          $scope.resetTemplate();
          if(!$scope.loading)
            update($scope.datadimension);
        }, true)
   
        

        $scope.$watch('config', function(){
          console.log("changed")
          $scope.resetTemplate();
          if(!$scope.loading)
            update();
        }, true)

        // defaults
     

        console.log("config", $scope.config);


        var volumeChart = dc.barChart('#monthly-volume-chart');
        var compositeChart = dc.compositeChart('#monthly-move-chart');

         function parseDate(d) {
            return new Date(d);
        }


        // Makes raw View Data ready for Crossfilter
        function formatCrossfilterData(rawViewData) {

            var viewDataRows = rawViewData.rows;

            viewDataRows.forEach(function (d, i) {
              d.index = i;
              d.dd = parseDate(d[1]);
              d.count = d[0];
              d.month = d3.time.month(d.dd);
              d.viewId = rawViewData["view_id"];
            });

            

            var viewData = [];
            for (var i = 0; i < viewDataRows.length; i++) {
              if (viewDataRows[i].count > 0) {
                for (var j = 0; j < viewDataRows[i].count; j++) {
                   var item = {
                    dd: viewDataRows[i]["dd"],
                    count: viewDataRows[i]["count"],
                    month: viewDataRows[i]["month"],
                    viewId: viewDataRows[i]["viewId"]
                   } 
                  viewData.push(item);
                }
              }
            }

            return viewData;

        }

        function getLayerByViewId(viewId){
          console.log("ALL LAYERS", $rootScope.allLayers);
           for(var i= 0; i < $rootScope.allLayers.length; i++){
                  if($rootScope.allLayers[i].feature["viewId"] == viewId){
                      return $rootScope.allLayers[i];
                  }
              }
        }


        var lineChartFactory = function(viewId, groupFunction, compositeChart, rawData){
          var color = rawData[viewId].color;
          var viewText = viewId;
          if(viewId.indexOf(","))
            viewText = viewId.slice(-24);

          console.log("Layer found", getLayerByViewId(viewText));
          var layer = getLayerByViewId(viewText);
          if(layer)
            viewText = layer.feature.data.name;
          return dc.lineChart(compositeChart)
                .colors(color)
                .group(groupFunction(viewId), viewText)
                .valueAccessor(function (d) {
                    return d.value;
                })
                // Title can be called by any stack layer.
                .title(function (d) {
                    var value = d.value.avg ? d.value.avg : d.value;
                    if (isNaN(value)) {
                        value = 0;
                    }
                    return dateFormat(d.key) + '\n' + numberFormat(value);
                });
        }


        function createLineCharts(rawData, groupFunction, compositeChart){
          var compositeCharts = [];

          for(var viewId in rawData){
              var lineChart = lineChartFactory(viewId, groupFunction, compositeChart, rawData);
              compositeCharts.push(lineChart);
          }

          return compositeCharts
        }

        function randomColors(total){
          var i = 360 / (total - 1); // distribute the colors evenly on the hue range
          var r = []; // hold the generated colors
          for (var x=0; x<total; x++)
          {
              r.push(HSVtoRGB(i * x, 100, 100)); // you can also alternate the saturation and value for even more contrast between the colors
          }
          return r;
        }

        function getColors(){
          return [
            "#800000","#00FFFF","#00008B","#008B8B","#FF7F50","#008000","#CD5C5C","#20B2AA","#B0C4DE","#BA55D3","#191970"
          ]
        }
        
        
        update();

        function update(selectedDim){


          var dateRange = [];
          var viewIds = [];

          if($scope.config && $scope.config.dateRange)
            dateRange = $scope.config.dateRange;

          if($scope.config && $scope.config.viewIds)
            viewIds = $scope.config.viewIds;


          $scope.loading = true;
          ApiService.getAllDailyVisitorsForMultipleViewIds(viewIds, dateRange).then(function(rawData){

            $scope.loading = false;
            

            var allData = [];
            var chartColors = getColors()
            console.log("gerated colors", chartColors);

            for(var viewId in rawData){
              if(chartColors != 0){
                rawData[viewId].color = chartColors.pop();
              }else{
                rawData[viewId].color = "red"
              }
                var dataItem = formatCrossfilterData(rawData[viewId]);
                console.log(viewId + " ==> ", dataItem);
                allData = allData.concat(dataItem);
            }


            

        
            // Since its a csv file we need to format the data a bit.
            var dateFormat = d3.time.format('%m/%d/%Y');
            var numberFormat = d3.format('.2f');

            //### Create Crossfilter Dimensions and Groups

            //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
            var ndx = crossfilter(allData);
            var all = ndx.groupAll();

            // Dimension by year
            var yearlyDimension = ndx.dimension(function (d) {
                return d3.time.year(d.dd).getFullYear();
            });

             // Dimension by full date
            var dateDimension = ndx.dimension(function (d) {
                return d.dd;
            });

            var viewDimension = ndx.dimension(function (d) {
                return d.view_id;
            });


            // Dimension by month
            var moveMonths = ndx.dimension(function (d) {
                return d.month;
            });
            // Group by total movement within month
            
            var currentDim = moveMonths;
            if(selectedDim){
              if(selectedDim == "day"){
                currentDim = dateDimension;
              }else{
                currentDim = moveMonths;
              }
            }
            /*
            var monthlyMoveGroup = moveMonths.group().reduceSum(function (d) {
                return Math.abs(d.close - d.open);
            });

            /*

            var monthlyCounts = moveMonths.group().reduceSum(function (d) {

                if(d.viewId == "57cecef763e5282d0d000402")
                    return d.count;
                return 0;
            });
            */

            var monthlyCountsByViewId = function(viewId){
                return currentDim.group().reduceSum(function (d) {

                    if(d.viewId == viewId)
                        return d.count;
                    return 0;
                })
            }


            var compositeCharts = createLineCharts(rawData, monthlyCountsByViewId, compositeChart);

            console.log("compositeCharts", compositeCharts);

            // Group by total volume within move, and scale down result
            var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
                return d.count;
            });


            compositeChart

                .width(990)
                .height(200)
                .transitionDuration(1000)
                .margins({top: 30, right: 50, bottom: 25, left: 40})
                .dimension(currentDim)
                .mouseZoomable(false)
            // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
                .rangeChart(volumeChart)
                .x(d3.time.scale().domain([new Date(2012, 0, 1), new Date(2016, 11, 31)]))
                .round(d3.time.month.round)
                .xUnits(d3.time.months)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .brushOn(false)
                .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
            .compose(createLineCharts(rawData, monthlyCountsByViewId, compositeChart));


            //#### Range Chart

            // Since this bar chart is specified as "range chart" for the area chart, its brush extent
            // will always match the zoom of the area chart.
            volumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
                .height(40)
                .margins({top: 0, right: 50, bottom: 20, left: 40})
                .dimension(moveMonths)
                .group(volumeByMonthGroup)
                .centerBar(true)
                .gap(1)
                .x(d3.time.scale().domain([new Date(2012, 0, 1), new Date(2016, 11, 31)]))
                .round(d3.time.month.round)
                .alwaysUseRounding(true)
                .xUnits(d3.time.months);

            volumeChart.yAxis().ticks(0);



            dc.renderAll();


          });//ApiService

        }
        
        

      },
      link: function postLink(scope, element, attrs) {

        var template = '<div class="clearfix"></div>';

        // Reset template of line diagram
        scope.resetTemplate = function(callback){
          console.log("resetting chart");
          var myEl = angular.element(element[0].querySelector('#monthly-move-chart'));
          myEl.html(template);
        }

        element.on('$destroy', function() {
          scope.resetTemplate();
        });

      }
    };
  });
