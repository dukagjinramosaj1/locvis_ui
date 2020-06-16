'use strict';

/**
 * @ngdoc function
 * @name locationAnalyticsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the locationAnalyticsApp
 */
angular.module('locationAnalyticsApp')
  .controller('MainCtrl', function (ApiService, $scope, $rootScope, $timeout, $mdPanel, $controller, $q) {

    $scope.isPanelOpen = false;

    $rootScope.settings = {
      dataType: {
        taxi: true,
        bicycle: false,
        weather: false
      },
      dimensions:[
        {
          name: "Visitors",
          dim: "allVisitors",
          selected: false
        },
        {
          name: "Trips",
          dim: "allVisitors",
          selected: false
        },
        {
          name: "Tips",
          dim: "allTips",
          selected: false
        },
      ],
      metrics:[
        {
          name: "Count",
          dim: "count",
          selected: false
        },
        {
          name: "Matrix",
          dim: "odMatrixCountAgg",
          selected: false
        },
        {
          name: "Average",
          dim: "avg",
          selected: false
        },
      ],
      visuTools: {
        lineGraph: false,
        chord: false,
      },
      dateRange: [new Date("01.07.2013"), new Date("01.07.2016")],
      viewIds: []
    };

  
//["57cecef763e5282d0d000402", "57cecef763e5282d0d0003ec"]
    $scope.selectDimension = function(dimension){
      dimension.selected = !dimension.selected;
    }


    $scope.showModal = function(){
      var mdPanel = $mdPanel;
      var position = mdPanel.newPanelPosition()
      .absolute()
        .top('8px')
        .left('450px');

      var config = {
        attachTo: angular.element(document.body),
        disableParentScroll: true,
        templateUrl: 'views/panel.tmpl.html',
        hasBackdrop: true,
        panelClass: 'stats-panel',
        position: position,
        trapFocus: true,
        zIndex: 3,
        clickOutsideToClose: true,
        escapeToClose: true,
        focusOnOpen: true,
        onOpenComplete: addPanel,
        onRemoving: removePanel
      };

      mdPanel.open(config).then(function(result) {
          $rootScope.panel = result;
        });
    }

    $scope.closeModal = function(){
      $mdPanel.close();
    }

    $scope.dataTypeIcon = "keyboard_arrow_down";
    $scope.dimensionIcon = "keyboard_arrow_down";
    $scope.metricIcon = "keyboard_arrow_down";
    $scope.visuIcon = "keyboard_arrow_down";


    function removePanel(){
      $scope.isPanelOpen = false;
    }

    function addPanel(){
      $scope.isPanelOpen = true;
    }


    $scope.isShowAll = false;
    $scope.showAllText= "Show all options";
    $scope.showAllIcon = "keyboard_arrow_right";

    $scope.showAll = function(){
      $scope.isShowAll = !$scope.isShowAll;

      if($scope.isShowAll){
        $scope.showAllText= "Hide all options";
        $scope.showwAllIcon = "keyboard_arrow_down";
        $scope.showDataType = true;
        $scope.showData = true;
        $scope.showMetrics = true;
        $scope.showVisual = true;
      }else{
        $scope.showAllText= "Show all options";
        $scope.showwAllIcon = "keyboard_arrow_right";
        $scope.showDataType = false;
        $scope.showData = false;
        $scope.showMetrics = false;
        $scope.showVisual = false;
      }

      

    }

    $scope.toggleDataType = function () {
    $scope.showDataType = !$scope.showDataType
    if($scope.showDataType){
      $scope.dataTypeIcon = "keyboard_arrow_down";
    }else{
      $scope.dataTypeIcon = "keyboard_arrow_right";
    }


    }
    $scope.toggleData = function () {
       $scope.showData = !$scope.showData
       if($scope.showData){
      $scope.dimensionIcon = "keyboard_arrow_down";
    }else{
      $scope.dimensionIcon = "keyboard_arrow_right";
    }
    }

    $scope.toggleVisual = function () {
         $scope.showVisual = !$scope.showVisual
         if($scope.showVisual){
       $scope.visuIcon = "keyboard_arrow_down";
    }else{
       $scope.visuIcon = "keyboard_arrow_right";
    }
    } 
    $scope.toggleMetrics = function () {
         $scope.showMetrics = !$scope.showMetrics
         if($scope.showMetrics){
       $scope.metricIcon = "keyboard_arrow_down";
    }else{
       $scope.metricIcon = "keyboard_arrow_right";
    }
    } 


    $scope.selectedDates = [new Date(2015, 1, 1), new Date(2015, 4, 1)];

    $rootScope.selectedDates = $scope.selectedDates;

    
    $scope.loading = true;

    $scope.isAllActive = false;
    $scope.isHeatMapActive = false;

    $scope.isSelected = false;


    $scope.selectedCount = 0;

    $scope.isSideNavOpen = true;

    $rootScope.$watch("isSideNavOpen", function(){
      $scope.isSideNavOpen = $rootScope.isSideNavOpen;
    });

        //Function for having Search Chips and also Coloring the multi selected Chip Zones//

     ApiService.getZones().then(function (data) {

          console.log("zones data", data);

          var pendingSearch, cancelSearch = angular.noop;
          var cachedQuery, lastSearch;

          $scope.allContacts = loadContacts();
          $scope.contacts = [$scope.allContacts[0]];
          $scope.selectedViewIds = [];
          $scope.filterSelected = true;



          $scope.querySearch = querySearch;
          $scope.delayedQuerySearch = delayedQuerySearch;



          $scope.$watch("selectedViewIds", function (newVal, oldVal) {

              var viewIds = [];
              for(var i= 0; i < $scope.selectedViewIds.length; i++){
                  var founditem = findLayerforSearch($scope.selectedViewIds[i])

                  if(founditem && founditem.feature && founditem.feature.viewId){
                      founditem.setStyle({fillColor: '#3a8bca'});
                      founditem.setStyle({weight: 2});
                      viewIds.push(founditem.feature);
                  }
              }
              
              $rootScope.settings.viewIds = viewIds;
              console.log("selected view ids", viewIds);

              if(oldVal.length > newVal.length){
                normalizeMap();
                paintMap();
              }

          }, true);

            
          function normalizeMap(){
            for(var i = 0; i < $rootScope.allLayers.length; i++){
            
              $rootScope.allLayers[i].setStyle({fillColor: '#b2ddf4'});
              $rootScope.allLayers[i].setStyle({weight: 1});
            }
          }

          function paintMap(){
             for(var i= 0; i < $scope.selectedViewIds.length; i++){
                  var founditem = findLayerforSearch($scope.selectedViewIds[i])

                  if(founditem && founditem.feature && founditem.feature.viewId){
                      founditem.setStyle({fillColor: '#3a8bca'});
                      founditem.setStyle({weight: 2});
                  }
              }
          }


          $rootScope.mapSelection = function(viewName, layer, viewId){
            console.log(viewId);
            console.log("allContacts", $scope.allContacts);
            console.log("selected options", layer.options);

            if(layer.options.fillColor === "#3a8bca"){
              deleteChipByViewName(layer.feature.data.name);
            }


            var foundChip = findChipByName(viewName);
            if(foundChip && !doesChipExists(foundChip)){
              $scope.selectedViewIds.push(foundChip);

              layer.setStyle({fillColor: '#3a8bca'});
              layer.setStyle({weight: 2});

            }
          }

          function deleteChipByViewName(viewName){
            console.log("deleteChipByViewName", viewName);
            console.log("slectedviewids", $scope.selectedViewIds);
            var newChips = [];
            for(var i = 0; i < $scope.selectedViewIds.length; i++){
              if($scope.selectedViewIds[i].name !== viewName)
                newChips.push($scope.selectedViewIds[i]);
            }
            console.log("NEW CHIPS", newChips);
            $timeout(function() {
              $scope.selectedViewIds = newChips;  
            }, 10);
            

          }


          function findChipByName(viewName){
            for(var i = 0; i < $scope.allContacts.length; i++){
              if($scope.allContacts[i].name == viewName)
                return $scope.allContacts[i];
            }
            return 0;

          }

          function doesChipExists(chip){
            console.log("allchips", $scope.selectedViewIds, " chip ", chip);
            for(var i = 0; i < $scope.selectedViewIds.length; i++){
              if($scope.selectedViewIds[i].name == chip.name)
                return true;
              
            }
            return false;
          }


          function querySearch (criteria) {
              cachedQuery = cachedQuery || criteria;
              return cachedQuery ? $scope.allContacts.filter(createFilterFor(cachedQuery)) : [];
          }

          function delayedQuerySearch(criteria) {
              cachedQuery = criteria;
              if ( !pendingSearch || !debounceSearch() )  {
                  cancelSearch();

                  return pendingSearch = $q(function(resolve, reject) {
                      // Simulate async search... (after debouncing)
                      cancelSearch = reject;
                      $timeout(function() {

                          resolve( $scope.querySearch() );

                          refreshDebounce();
                      }, Math.random() * 500, true)
                  });
              }
              return pendingSearch;
          }

          function refreshDebounce() {
              lastSearch = 0;
              pendingSearch = null;
              cancelSearch = angular.noop;
          }

          function findLayerforSearch(searchObject) {
              for(var i= 0; i < $rootScope.allLayers.length; i++){
                  var name = searchObject.name;



                  if($rootScope.allLayers[i].feature.data["name"] == name){
                      return $rootScope.allLayers[i];
                  }
              }

          }

          function findViewForSearch(searchObject){
            console.log("allview", $rootScope.allViews);
            for(var i= 0; i < $rootScope.allViews.length; i++){
                  var name = searchObject.name;
                  if($rootScope.allViews[i]["name"].indexOf(name) !== -1){
                      return data[i];
                  }
              }
          }

          /!*  Debounce if querying faster than 300ms*!/

          function debounceSearch() {
              var now = new Date().getMilliseconds();
              lastSearch = lastSearch || now;

              return ((now - lastSearch) < 300);
          }

          function createFilterFor(query) {
              var lowercaseQuery = angular.lowercase(query);

              return function filterFn(contact) {
                  return (contact._lowername.indexOf(lowercaseQuery) != -1);
              };

          }

          function loadContacts() {
              var contacts = data;


              return contacts.map(function (c, index) {
                  // var cParts = c.split(' ');
                  var contact = {
                      name: c.name
                      //   email: cParts[0][0].toLowerCase() + '.' + cParts[1].toLowerCase() + '@example.com',
                      //  image: 'http://lorempixel.com/50/50/people?' + index
                  };
                  contact._lowername = contact.name.toLowerCase();
                  return contact;
              });
          }

          console.log("test", data);


          $scope.toggleLeft = buildToggler('left');
          $scope.toggleRight = buildToggler('right');

          function buildToggler(componentId) {
              return function() {
                  $mdSidenav(componentId).toggle();
              }
          }
      });


    $rootScope.$watch('settings.visuTools', function(newVal, oldVal){
      console.log("visuTools changed");
      //draw();
    }, true)


    $scope.draw = draw;
    function draw(){

      if($rootScope.settings.viewIds == 0)
        return 0;

      if(!$scope.isPanelOpen)
        $scope.showModal();

    }


    /* Toast */

  




    $scope.selectedViewId = {
      viewName: "",
      viewData: {},
      isSelected: false
    };


    $scope.closeView = function () {
      $scope.selectedViewId.isSelected = false;

      $scope.selectedViewId.layer.setStyle({fillColor: '#B0DE5C'});
      $scope.selectedViewId.layer.setStyle({weight: 2});

      $rootScope.map.invalidateSize();

    }

    $rootScope.$watch("selectedEntries", function(){
      console.log("selectedEntries", $rootScope.selectedEntries);
      if($rootScope.selectedEntries)
        onSelectedEntriesChanged($rootScope.selectedEntries);
    }, true)

    function onSelectedEntriesChanged(selectedEntries){
            var sum = 0;
            for (var i = 0; i < selectedEntries.length; i++) {
              //for(var j = 0; j < selectedViews[i].values)
              sum = sum + selectedEntries[i].values[0].count;
            }

            $scope.selectedCount = sum;

    }

  
    

  });
