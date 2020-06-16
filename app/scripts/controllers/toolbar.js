'use strict';


angular.module('locationAnalyticsApp')
  .controller('ToolbarCtrl', function (ApiService, $scope, GeoCodingService, $rootScope, $q, $timeout, $log, $mdSidenav) {

    $scope.showSearch = false;

    $scope.toggleLeft = buildToggler('left');

    $scope.searchBar = function () {
      $scope.showSearch = !$scope.showSearch;
    }


    $scope.close = function () {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav('left').close()
        .then(function () {
          $log.debug("close RIGHT is done");
        });
    };

    function buildToggler(navID) {
      return function() {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav(navID)
          .toggle()
          .then(function () {
            $log.debug("toggle " + navID + " is done");
          });
      }
    }


    function debounce(func, wait, context) {
      var timer;

      return function debounced() {
        var context = $scope,
            args = Array.prototype.slice.call(arguments);
        $timeout.cancel(timer);
        timer = $timeout(function() {
          timer = undefined;
          func.apply(context, args);
        }, wait || 10);
      };
    }

    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildDelayedToggler(navID) {
      return debounce(function() {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav(navID)
          .toggle()
          .then(function () {
            $log.debug("toggle " + navID + " is done");
          });
      }, 200);
    }


    //define variables
    $scope.lng = 0;
    $scope.lat = 0;
    $scope.address = "";

    $scope.isSelected = false;


    $scope.searchAddress = searchAddress;
    function searchAddress() {


      console.log("search");
      GeoCodingService.getCoordinates($scope.searchInput).then(function (data) {
        console.log(data);
        $scope.lng = data.results[0].geometry.location.lng;
        $scope.lat = data.results[0].geometry.location.lat;
        $scope.address = data.results[0].formatted_address;
        $rootScope.map.setView([$scope.lat,$scope.lng],15);
      })
    }




    $scope.openLeftMenu = function(){
      console.log("openLeftMenu");
      $rootScope.isSideNavOpen = !$rootScope.isSideNavOpen;
      console.log("sidenav", $rootScope.isSideNavOpen)
    }



    ApiService.getZones().then(function (data) {



      $scope.simulateQuery = false;
      $scope.isDisabled    = false;

      // list of `state` value/display objects
      $scope.states        = loadAll();
      $scope.querySearch   = querySearch;
      $scope.selectedItemChange = selectedItemChange;
      $scope.searchTextChange   = searchTextChange;

      $scope.newState = newState;

      function newState(state) {
        alert("Sorry! You'll need to create a Constitution for " + state + " first!");
      }

      // ******************************
      // Internal methods
      // ******************************

      /**
       * Search for states... use $timeout to simulate
       * remote dataservice call.
       */
      function querySearch (query) {
        var results = query ? $scope.states.filter( createFilterFor(query) ) : $scope.states,
          deferred;
        if ($scope.simulateQuery) {
          deferred = $q.defer();
          $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
          return deferred.promise;
        } else {
          return results;
        }
      }

      function searchTextChange(text) {
        $log.info('Text changed to ' + text);
      }

      function selectedItemChange(item) {
        $scope.isSelected = true;
        $log.info('Item changed to ' + JSON.stringify(item));

        $rootScope.map.setView([item.data.geometry[0][0][1], item.data.geometry[0][0][0]],13);
        //console.log("item", item);
        //console.log("FOUND LAYER", findLayerforSearch(item));

        var foundLayer= findLayerforSearch(item);
        foundLayer.setStyle({fillColor: '#C75320'});
        foundLayer.setStyle({weight: 5})
      }

      function findLayerforSearch(searchObject) {
        console.log("ALL LAYERS", $rootScope.allLayers);
        for(var i= 0; i < $rootScope.allLayers.length; i++){
          var foundid = searchObject.data["_id"];

          if($rootScope.allLayers[i].feature.data["_id"] == foundid){
            return $rootScope.allLayers[i];
          }
        }

      }

      /**
       * Build `states` list of key/value pairs
       */
      function loadAll() {
        var allStates = 'New York';

        return data.map( function (state) {
          return {
            value: state.name.toLowerCase(),
            display: state.name,
            data: state
          };
        });
      }

      /**
       * Create filter function for a query string
       */
      function createFilterFor(query) {
        var lowercaseQuery = angular.lowercase(query);

        return function filterFn(state) {
          return (state.value.indexOf(lowercaseQuery) === 0);
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



    });





  });
