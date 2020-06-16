'use strict';


angular.module('locationAnalyticsApp')
  .controller('ChartCtrl', function ($scope, ApiService) {

    //var moveChart = dc.lineChart('#monthly-move-chart');
    var volumeChart = dc.barChart('#monthly-volume-chart');

    $scope.loading = true;


    var compositeChart = dc.compositeChart('#monthly-move-chart');

    var dateRange = ["2013-07-01T11%3A00", "2016-07-03T20%3A00"];

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


    var o = ["57cecef763e5282d0d000402", "57cecef763e5282d0d0003ec"];

    ApiService.getAllDailyVisitorsForMultipleViewIds(o, dateRange).then(function(data){
        $scope.loading = false;
        

        var allData = [];
        for(var viewId in data){
            var dataItem = formatCrossfilterData(data[viewId]);
            console.log(viewId + " ==> ", dataItem);
            allData = allData.concat(dataItem);
        }


        data = formatCrossfilterData(data["57cecef763e5282d0d000402"]);

    


    
        // Since its a csv file we need to format the data a bit.
        var dateFormat = d3.time.format('%m/%d/%Y');
        var numberFormat = d3.format('.2f');


        console.log(allData);

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
        
        var monthlyMoveGroup = moveMonths.group().reduceSum(function (d) {
            return Math.abs(d.close - d.open);
        });

        var monthlyCounts = moveMonths.group().reduceSum(function (d) {

            if(d.viewId == "57cecef763e5282d0d000402")
                return d.count;
            return 0;
        });

        var monthlyCountsByViewId = function(viewId){
            return moveMonths.group().reduceSum(function (d) {

                if(d.viewId == viewId)
                    return d.count;
                return 0;
            })
        }

        // Group by total volume within move, and scale down result
        var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
            return d.count;
        });


        compositeChart

            .width(990)
            .height(200)
            .transitionDuration(1000)
            .margins({top: 30, right: 50, bottom: 25, left: 40})
            .dimension(moveMonths)
            .mouseZoomable(true)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
            .rangeChart(volumeChart)
            .x(d3.time.scale().domain([new Date(2012, 0, 1), new Date(2016, 11, 31)]))
            .round(d3.time.month.round)
            .xUnits(d3.time.months)
            .elasticY(true)
            .renderHorizontalGridLines(true)
            .brushOn(false)
            .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        .compose([
        // when creating sub-chart you need to pass in the parent chart
        
        dc.lineChart(compositeChart)
            .colors('red')
            .group(monthlyCountsByViewId('57cecef763e5282d0d0003ec'), '57cecef763e5282d0d0003ec')
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
            }),
            dc.lineChart(compositeChart)
            .colors('green')
            .group(monthlyCountsByViewId('57cecef763e5282d0d000402'), '57cecef763e5282d0d000402')
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
            })
    ]);




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


        dc.renderAll();


});//ApiService

  });
