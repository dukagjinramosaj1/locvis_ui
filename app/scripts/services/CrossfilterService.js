'use strict';


angular.module('locationAnalyticsApp')
  .service('CrossfilterService', [
    '$rootScope',
    'ApiService',
    '$q',
    'CrossfilterDataService',
    '$timeout',
    function CrossfilterService($rootScope, ApiService, $q, CrossfilterDataService, $timeout) {

    

      var allCrossfilterData = [];

      var allData = [];
      var cachedDates = [];

      var viewDimension = {};
      var currentView, currentElement, barCharts, chartsDiv, listDiv;

      var bufferList = [];
      var brushRange = [];

      var pendingRequests = [];
      var pendingRequstsRunning = false;

      var chartRange = [new Date(2015, 1, 1), new Date(2015, 4, 1)];
      var filterRange = [new Date(2015, 2, 1), new Date(2015, 2, 7)];

      var bufferRunning = false;

      var resetCharts;


      var formatNumber = d3.format(",d"),
        formatChange = d3.format("+,d"),
        formatDate = d3.time.format("%B %d, %Y"),
        formatTime = d3.time.format("%I:%M %p");

      var nestByDate = d3.nest()
        .key(function (d) {
          return d3.time.day(d.date);
        });


      function getDates(startDate, stopDate) {
          var dateArray = new Array();
          var currentDate = startDate;
          while (currentDate <= stopDate) {
              dateArray.push( new Date (currentDate) )
              currentDate = addDays(currentDate, 1);
          }
          return dateArray;
      }


      function onBrushChanged(brushRange) {

        var selectedEntries = nestByDate.entries(viewDimension.date.top(300));




        //console.log(viewDimension.date.top(1));
        var top = addDays(viewDimension.date.top(1)[0], 1).getTime();

        //console.log(top);




        //console.log("TOP", viewDimension.date.top(1));
        //console.log("BOTTOM", viewDimension.date.bottom(1));

        //console.log("Brush range", brushRange);

        //console.log("all crossfilter", allCrossfilterData);


        //if (selectedEntries.length == 0) {
          filterRange = brushRange;
          getSelectedRange(brushRange);

        //}


      }


      function init(viewId, reset, selectedDates) {
        console.log("setting chartRange", selectedDates);

        var midpoint = new Date((selectedDates[0].getTime() + selectedDates[1].getTime()) / 2);
        filterRange = [midpoint, addDays(midpoint, 7)];

        chartRange = selectedDates;
        resetCharts = reset;
        $rootScope.crossfilterLoading = true;
        ApiService.getAllDailyVisitorsByViewId(viewId, filterRange).then(function (data) {
          $rootScope.crossfilterLoading = false;

          updateCrossfilterData(data);

          generateBuffer(filterRange);
        });

      }

      function getSelectedRange(range) {


        
        var pendingRequestsDates = clearCachedItemsFromRange(range);
        console.log(pendingRequestsDates);
        pendingRequests = pendingRequests.concat(pendingRequestsDates);
        loadRangeData();

        
      }

      function loadRangeData(){
        console.log("pending requests", pendingRequests);
        if(pendingRequstsRunning)
          return 0;

        if(pendingRequests.length > 0){
          var pendingDate = pendingRequests.shift();
          var pendingRange = [parseDate(pendingDate), parseDate(pendingDate)];

          pendingRequstsRunning = true;
          ApiService.getAllDailyVisitorsByViewId(currentView, pendingRange).then(function (data) {
            
            updateCrossfilterData(data);
            pendingRequstsRunning = false;

            if(pendingRequests.length > 0)
              loadRangeData();

          });
        }
      }

      function clearCachedItemsFromRange(selectedRange){
        var i;
        var start = parseDate(selectedRange[0]).toDateString();
        var end = parseDate(selectedRange[1]).toDateString();

        var notChachedDates = [];

        var allDatesBetweenRange =  getDates(selectedRange[0], selectedRange[1])
        for(i = 0; i < allDatesBetweenRange.length; i++){
          if(!cachedDates[currentView].hasOwnProperty(parseDate(allDatesBetweenRange[i]).toDateString()))
            notChachedDates.push(allDatesBetweenRange[i]);
        }

        return notChachedDates;

      }

      function getBuffer() {
        if (bufferRunning)
          return 0;

        bufferRunning = true;
        ApiService.getAllDailyVisitorsByViewId(currentView, bufferList.pop()).then(function (data) {


          updateCrossfilterData(data);

          bufferRunning = false;
          if (bufferList.length > 0)
            getBuffer();
        })

      }


      function generateBuffer(filterRange) {
        var rangePrv = [addDays(filterRange[0], -14), addDays(filterRange[0], -1)];
        var rangeNext = [addDays(filterRange[1], 1), addDays(filterRange[1], 14)];

        bufferList.push(rangePrv);
        bufferList.push(rangeNext);
        getBuffer();
      }


      function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }

      function updateCrossfilterData(crossfilterData) {

        currentView = crossfilterData["view_id"];
        console.log(currentView);
        if(typeof cachedDates[currentView] !== 'undefined')
          crossfilterData = removeCachedData(crossfilterData);


        crossfilterData = formatCrossfilterData(crossfilterData);


        resetCharts();


        if (!allCrossfilterData.hasOwnProperty(currentView)) {
          allData[currentView] = crossfilterData;
          allCrossfilterData[currentView] = crossfilter(allData[currentView]);
        } else {
          allData[currentView] = allData[currentView].concat(crossfilterData);
          console.log("check here", allData[currentView])
          allCrossfilterData[currentView] = crossfilter(allData[currentView]);
        }

        updateCrossfilter();
      }

      function removeCachedData(data){


        var newData = Object.assign({}, data);
        newData.rows = [];

        for(var i = 0; i < data.rows.length; i++){
          var cacheDate = parseDate(data.rows[i][1]).toDateString();
          if(typeof cachedDates[currentView][cacheDate] === 'undefined'){

            newData.rows.push(data.rows[i]);
          }
        }


        return newData;

      }

      function updateCrossfilter() {

        updateViewDimensions();

        updateCharts();

        chartsDiv = d3.selectAll(".chart")
          .data(barCharts)
          .each(function (chart) {
            chart.on("brush", renderAll).on("brushend", renderAll);
          });

        // Render the initial lists.
        listDiv = d3.selectAll(".list")
          .data([viewDataList]);

        // Render the total.
        d3.selectAll("#total")
          .text(formatNumber(allCrossfilterData[currentView].size()));

        renderAll();

      }

      function updateCharts() {
        barCharts = [
          barChart()
            .dimension(viewDimension.date)
            .group(viewDimension.dates)
            .round(d3.time.day.round)
            .x(d3.time.scale()
              .domain(chartRange)
              .rangeRound([0, 10 * 90]))
            .filter(filterRange),
          barChart()
            .dimension(viewDimension.hour)
            .group(viewDimension.hours)
            .x(d3.scale.linear()
              .domain([0, 24])
              .rangeRound([0, 10 * 24]))

        ];
      }


      function updateViewDimensions() {
        viewDimension.all = allCrossfilterData[currentView].groupAll();
        viewDimension.date = allCrossfilterData[currentView].dimension(function (d) {
          return d.date;
        });
        viewDimension.dates = viewDimension.date.group(d3.time.day);
        viewDimension.hour = allCrossfilterData[currentView].dimension(function (d) {
          return d.date.getHours() + d.date.getMinutes() / 60;
        });
        viewDimension.hours = viewDimension.hour.group(Math.floor);

      }

      // Makes raw View Data ready for Crossfilter
      function formatCrossfilterData(rawViewData) {

        var viewDataRows = rawViewData.rows;

        viewDataRows.forEach(function (d, i) {
          if (!cachedDates.hasOwnProperty(rawViewData["view_id"]))
            cachedDates[rawViewData["view_id"]] = {};
          cachedDates[rawViewData["view_id"]][parseDate(d[1]).toDateString()] = 1;
          d.index = i;
          d.date = parseDate(d[1]);
          d.count = d[0];
          d.viewId = rawViewData["view_id"];
        });

        console.log(cachedDates);

        var viewData = [];
        for (var i = 0; i < viewDataRows.length; i++) {
          if (viewDataRows[i].count > 0) {
            for (var j = 0; j < viewDataRows[i].count; j++) {
              viewData.push(viewDataRows[i]);
            }
          }
        }

        return viewData;

      }


      // Renders the specified chart or list.
      function render(method) {
        d3.select(this).call(method);
      }

      // Whenever the brush moves, re-rendering everything.
      function renderAll() {
      
        chartsDiv.each(render);
        listDiv.each(render);
        d3.select("#active").text(formatNumber(viewDimension.all.value()));
      }


      window.filter = function (filters) {
        filters.forEach(function (d, i) {
          barCharts[i].filter(d);
        });

        renderAll();
      };

      window.reset = function (i) {
        barCharts[i].filter(null);
        renderAll();
      };

      function resize(){
        //getSelectedRange(brushRange);
        var dumb = {
          rows: []
        }
        updateCrossfilterData(dumb);
      }

      //window.addEventListener('resize', resize);


      function viewDataList(div) {
        var selectedEntries = nestByDate.entries(viewDimension.date.top(300));

        $timeout(function(){
          $rootScope.selectedEntries = selectedEntries;
        }, 20);
        

        //console.log(viewDimension.date.top(300));

        //CrossfilterDataService.getBuffer(selectedEntries);
        // updateViewData(flightsByDate);


        div.each(function () {
          var date = d3.select(this).selectAll(".date")
            .data(selectedEntries, function (d) {
              return d.key;
            });

          date.enter().append("div")
            .attr("class", "date")
            .append("div")
            .attr("class", "day")
            .text(function (d) {
              return formatDate(d.values[0].date);
            });

          date.exit().remove();

          var flight = date.order().selectAll(".flight")
            .data(function (d) {
              return d.values;
            }, function (d) {
              return d.index;
            });

          var flightEnter = flight.enter().append("div")
            .attr("class", "flight");

          flightEnter.append("div")
            .attr("class", "time")
            .text(function (d) {
              return formatTime(d.date);
            });

          flightEnter.append("div")
            .attr("class", "origin")
            .text(function (d) {
              return d.origin;
            });

          flightEnter.append("div")
            .attr("class", "destination")
            .text(function (d) {
              return d.destination;
            });

          flightEnter.append("div")
            .attr("class", "distance")
            .text(function (d) {
              return "";
            });

          flightEnter.append("div")
            .attr("class", "delay")
            .classed("early", function (d) {
              return d.delay < 0;
            })
            .text(function (d) {
              return d.count;
            });

          flight.exit().remove();

          flight.order();
        });
      }

      function barChart() {
        if (!barChart.id) barChart.id = 0;

        var margin = {top: 10, right: 10, bottom: 20, left: 10},
          x,
          y = d3.scale.linear().range([100, 0]),
          id = barChart.id++,
          axis = d3.svg.axis().orient("bottom"),
          brush = d3.svg.brush(),
          brushDirty,
          dimension,
          group,
          round;

        function chart(div) {
        
          var width = x.range()[1],
            height = y.range()[0];
        
          y.domain([0, group.top(1)[0].value]);

          div.each(function () {
            var div = d3.select(this),
              g = div.select("g");

            // Create the skeletal chart.
            if (g.empty()) {
              div.select(".title").append("a")
                .attr("href", "javascript:reset(" + id + ")")
                .attr("class", "reset")
                .text("reset")
                .style("display", "none");

              g = div.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              g.append("clipPath")
                .attr("id", "clip-" + id)
                .append("rect")
                .attr("width", width)
                .attr("height", height);

              g.selectAll(".bar")
                .data(["background", "foreground"])
                .enter().append("path")
                .attr("class", function (d) {
                  return d + " bar";
                })
                .datum(group.all());

              g.selectAll(".foreground.bar")
                .attr("clip-path", "url(#clip-" + id + ")");

              g.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + height + ")")
                .call(axis);

              // Initialize the brush component with pretty resize handles.
              var gBrush = g.append("g").attr("class", "brush").call(brush);
              gBrush.selectAll("rect").attr("height", height);
              gBrush.selectAll(".resize").append("path").attr("d", resizePath);
            }

            // Only redraw the brush if set externally.
            if (brushDirty) {
              brushDirty = false;
              g.selectAll(".brush").call(brush);
              div.select(".title a").style("display", brush.empty() ? "none" : null);
              if (brush.empty()) {
                g.selectAll("#clip-" + id + " rect")
                  .attr("x", 0)
                  .attr("width", width);
              } else {
                var extent = brush.extent();
                g.selectAll("#clip-" + id + " rect")
                  .attr("x", x(extent[0]))
                  .attr("width", x(extent[1]) - x(extent[0]));
              }
            }

            g.selectAll(".bar").attr("d", barPath);
          });

          function barPath(groups) {
            var path = [],
              i = -1,
              n = groups.length,
              d;
            while (++i < n) {
              d = groups[i];
              path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
            }
            return path.join("");
          }

          function resizePath(d) {
            var e = +(d == "e"),
              x = e ? 1 : -1,
              y = height / 3;
            return "M" + (.5 * x) + "," + y
              + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
              + "V" + (2 * y - 6)
              + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
              + "Z"
              + "M" + (2.5 * x) + "," + (y + 8)
              + "V" + (2 * y - 8)
              + "M" + (4.5 * x) + "," + (y + 8)
              + "V" + (2 * y - 8);
          }
        }

        brush.on("brushstart.chart", function () {
          var div = d3.select(this.parentNode.parentNode.parentNode);
          div.select(".title a").style("display", null);
        });

        brush.on("brush.chart", function () {
          var g = d3.select(this.parentNode),
            extent = brush.extent();
          if (round) g.select(".brush")
            .call(brush.extent(extent = extent.map(round)))
            .selectAll(".resize")
            .style("display", null);
          g.select("#clip-" + id + " rect")
            .attr("x", x(extent[0]))
            .attr("width", x(extent[1]) - x(extent[0]));
          dimension.filterRange(extent);
        });

        brush.on("brushend.chart", function () {
          if (brush.empty()) {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title a").style("display", "none");
            div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
            dimension.filterAll();
          }
          //brushRange = brush.extent();
          onBrushChanged(brush.extent());

        });

        chart.margin = function (_) {
          if (!arguments.length) return margin;
          margin = _;
          return chart;
        };

        chart.x = function (_) {
          if (!arguments.length) return x;
          x = _;
          axis.scale(x);
          brush.x(x);
          return chart;
        };

        chart.y = function (_) {
          if (!arguments.length) return y;
          y = _;
          return chart;
        };

        chart.dimension = function (_) {
          if (!arguments.length) return dimension;
          dimension = _;
          return chart;
        };

        chart.filter = function (_) {
          if (_) {
            brush.extent(_);
            dimension.filterRange(_);
          } else {
            brush.clear();
            dimension.filterAll();
          }
          brushDirty = true;
          return chart;
        };

        chart.group = function (_) {
          if (!arguments.length) return group;
          group = _;
          return chart;
        };

        chart.round = function (_) {
          if (!arguments.length) return round;
          round = _;
          return chart;
        };

        return d3.rebind(chart, brush, "on");
      }


      function parseDate(d) {
        return new Date(d);
      }


      return {
        update: init
      };

    }]);
