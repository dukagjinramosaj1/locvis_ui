'use strict';

/**
 * @ngdoc directive
 * @name locationAnalyticsApp.directive:laLeafletMap
 * @description
 * # laLeafletMap
 */
angular.module('locationAnalyticsApp')
  .directive('laLeafletMap', function (ApiService) {
    return {
      template: '<div id="leafletmap" flex></div>',
      restrict: 'E',
      scope: {
        selectedview: '=',
        statsloading: '=',
        showall: '=',
        showheatmap: '=',
      },
      controller: function ($scope, $timeout, PolylabelService, $rootScope) {

        $rootScope.map = $scope.map;
        $scope.root = $rootScope;

        $scope.statsloading = false;
        $scope.PolylabelService = PolylabelService;

        $scope.areaStats = {
          allVisitors: {}
        };

        $scope.allLayers = [];
        $rootScope.allLayers = $scope.allLayers


        $scope.targetView = function (viewName, viewId) {
          $scope.map.invalidateSize();
          if ($scope.selectedview.isSelected)
            return 0; // don't target if a view is active
          $timeout(function () {

            //console.log(viewId);
            //console.log($scope.areaStats.allVisitors[viewId]);

            $scope.selectedview = {
              viewName: viewName,
              viewData: $scope.areaStats.allVisitors[viewId],
              isSelected: $scope.selectedview.isSelected
            };

            //$scope.selectedview = data;
          }, 1);
        };


        $scope.selectView = function (viewName, layer, viewId) {
          $timeout(function () {

            $rootScope.mapSelection(viewName, layer, viewId);
/*
            if($scope.selectedview.isSelected){
              $scope.selectedview.layer.setStyle({fillColor: '#B0DE5C'});
              $scope.selectedview.layer.setStyle({weight: 2});
            }
            */
            $scope.selectedview = {
              viewId: viewId,
              viewName: viewName,
              isSelected: true,
              layer: layer,
              viewData: $scope.selectedview.viewData
            };
           // $scope.selectedview.layer.setStyle({fillColor: '#B0DE5C'});
            //$scope.selectedview.layer.setStyle({weight: 2});

            //layer.setStyle({fillColor: '##C75320'});
            //layer.setStyle({weight: 5});
          }, 1);

        };

        $scope.setRootScope = function (map) {
          $rootScope.map = map;
        };

        $scope.showStats = function (view) {
          //console.log(view);
          ApiService.getAllVisitorsByViewId(view).then(function (data) {
            //console.log(data);
          })
        }
      },
      link: function postLink(scope, element, attrs) {
        
        var activeLayers = {};
        var heatMap = {};


        scope.$watch('showall', function () {
          //console.log(scope.showall);
          //console.log(scope.allLayers);

          for (var i = 0; i < scope.allLayers.length; i++) {
//            scope.allLayers[i].setStyle({fillOpacity: 0.0});
            if (scope.showall) {
              if (!activeLayers.hasOwnProperty(scope.allLayers[i].feature.viewId))
                scope.map.removeLayer(scope.allLayers[i]);
            } else {
              if (!activeLayers.hasOwnProperty(scope.allLayers[i].feature.viewId))
                scope.map.addLayer(scope.allLayers[i]);
            }
          }
        });

        scope.$watch('showheatmap', function () {

          //console.log("HEATMAP", heatMap);
          for (var i = 0; i < scope.allLayers.length; i++) {
            if (scope.showheatmap) {
              scope.map.removeLayer(scope.allLayers[i]);
              scope.map.addLayer(heatMap);
            } else {
              scope.map.addLayer(scope.allLayers[i]);
              scope.map.removeLayer(heatMap);
              scope.showall = false;
            }
          }
        });


        function normalizeData(data) {
          var i, normalizedData;


          normalizedData = [];

          for (i = 0; i < data.length; i++) {

            var dataItem = {
              "id": data[i]._id,
              "type": "Feature",
              "properties": {
                "popupContent": data[i].name,
                "style": {
                  weight: 1,
                  color: "#999",
                  opacity: 1,
                  fillColor: "#b2ddf4",
                  fillOpacity: 0.9
                }
              },
              "data": data[i],
              "polylabel": scope.PolylabelService.polylabel(data[i].geometry, 1),
              "geometry": {
                "type": "Polygon",
                "coordinates": data[i].geometry
              }
            };

            normalizedData.push(dataItem);

          }

          return normalizedData;
        }

        function addViewIdTo(geoZones, geoViews) {
          var i, j;

          for (i = 0; i < geoZones.length; i++) {
            for (j = 0; j < geoViews.length; j++) {
              if (geoViews[j].zone_arr[0] == geoZones[i].id) {
                geoZones[i].viewId = geoViews[j]._id;
              }
            }
          }
          return geoZones;
        }

        function loadStatsForZones(zones) {
          var check = 0;
          var i;
          var stats = [];
          var polylabel = {};
          scope.statsloading = true;
          for (i = 0; i < zones.length; i++) {
            
            (function (i) {

              ApiService.getAllVisitorsByViewId(zones[i].viewId).then(function (data) {
                check = check + 1;
              

                if (data.rows.length > 0) {
                  scope.areaStats.allVisitors[zones[i].viewId] = data;
                  polylabel[zones[i].viewId] = zones[i].polylabel;
                }
                if (check == zones.length - 1) {
                  
                  attacheHeatMap(scope.areaStats.allVisitors, polylabel);
                  scope.statsloading = false;
                }
              });
            })(i);
          }
        }

        function drawHeatMap(data) {

          //console.log(data);


          var cfg = {
            // radius should be small ONLY if scaleRadius is true (or small radius is intended)
            // if scaleRadius is false it will be the constant radius used in pixels
            "radius": 100,
            "maxOpacity": .8,
            // scales the radius based on map zoom
            "scaleRadius": false,
            // if set to false the heatmap uses the global maximum for colorization
            // if activated: uses the data maximum within the current map boundaries
            //   (there will always be a red spot with useLocalExtremas true)
            "useLocalExtrema": true,
            // which field name in your data represents the latitude - default "lat"
            latField: 'lat',
            // which field name in your data represents the longitude - default "lng"
            lngField: 'lng',
            // which field name in your data represents the data value - default "value"
            valueField: 'count'
          };

          var heatmapLayer = new HeatmapOverlay(cfg);

          //heatmapLayer.addTo(scope.map);
          heatmapLayer.setData(data);

          heatMap = heatmapLayer;
          //console.log("MY MAP:", scope.map);
        }

        function attacheHeatMap(data, polylabel) {
          //console.log(data);
          var overall = 0;

          var heatMapSums = [];

          for (var view in data) {
            if (data.hasOwnProperty(view)) {

              var sum = 0;
              for (var x = 0; x < data[view].rows.length; x++) {
                sum = sum + data[view].rows[x][1];
              }

              data[view].sum = sum;
              //console.log(data[view]);
              var item = {lat: polylabel[view][1], lng: polylabel[view][0], count: sum};
              heatMapSums.push(item);
              overall = overall + sum;
            }
          }

          var heatMapData = {
            max: overall,
            data: heatMapSums
          };


          drawHeatMap(heatMapData);


          for (var viewId in data) {
            if (data.hasOwnProperty(viewId)) {
              var layer = findLayerById(viewId);
              if (layer != null) {
                //layer.setStyle({fillColor: '#FFFFFF'});
                activeLayers[viewId] = layer
              }
            }
          }
        }

        function findLayerById(viewId) {
          for (var o = 0; o < scope.allLayers.length; o++) {

            if (scope.allLayers[o].feature.viewId == viewId)
              return scope.allLayers[o];
          }
          return null;
        }


        ApiService.getZones().then(function (data) {
          ApiService.getViews().then(function (geoViews) {

            scope.root.allViews = geoViews;

            var newyork = normalizeData(data);
            newyork = addViewIdTo(newyork, geoViews);
            loadStatsForZones(newyork);


            scope.map = L.map('leafletmap', {zoomControl: false}).setView([40.7239311, -74.0008287], 13);

            L.control.zoom({
                 position:'bottomright'
            }).addTo(scope.map);
            
            scope.setRootScope(scope.map);


            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3Rhc2tpbiIsImEiOiJjaXpiNWprMHYwb2owMzFxb3hoOGdkajd2In0.99yT0kZJd01JbdJ4fG1lvA', {
              maxZoom: 18,
              attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
              '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
              'Imagery © <a href="http://mapbox.com">Mapbox</a>',
              id: 'mapbox.light'
            }).addTo(scope.map);


            function onEachFeature(feature, layer) {
              var popupContent = "";

              if (feature.properties && feature.properties.popupContent) {
                popupContent += feature.properties.popupContent;
                layer.bindPopup(feature.properties.popupContent);
              }

              layer.on('mouseover', function () {

                if(scope.selectedview.isSelected && scope.selectedview.layer.feature.id == layer.feature.id)
                  return 0;

                console.log(feature.properties.popupContent);

                layer.openPopup();

                scope.targetView(feature.properties.popupContent, feature.viewId);
                //layer.setStyle({fillColor: '#FFFFFF'});
                //layer.setStyle({weight: 2});


              });
              layer.on('mouseout', function () {
                layer.closePopup();
                //console.log(layer);

                if(scope.selectedview.isSelected && scope.selectedview.layer.feature.id == layer.feature.id)
                  return 0;

                  //layer.setStyle({fillColor: '#B0DE5C'});
                  //layer.setStyle({weight: 2});

              });

              layer.on('click', function () {
            

                scope.selectView(feature.properties.popupContent, layer, feature.viewId);

              });

              //layer.bindPopup(popupContent);
              scope.allLayers.push(layer);
              //scope.allLayers.push(layer);
              //
              //console.log(scope.allLayers[0]);
            }


            L.geoJSON(newyork, {

              style: function (feature) {
                return feature.properties && feature.properties.style;
              },

              onEachFeature: onEachFeature,

              pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                  radius: 8,
                  fillColor: "#ff7800",
                  color: "#000",
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
                });
              }
            }).addTo(scope.map);


          });
        });


      }
    };
  });
