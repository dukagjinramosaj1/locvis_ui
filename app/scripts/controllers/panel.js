'use strict';


angular.module('locationAnalyticsApp')
  .controller('PanelDialogCtrl', [
    '$scope',
    '$rootScope',
    '$mdPanel',
    function PanelDialogCtrl($scope, $rootScope, $mdPanel) {


    	$scope.panelTitle = $rootScope.settings.viewIds.length == 1 ? 'Analytics report for ' + $rootScope.settings.viewIds[0].properties.popupContent : 'Multiple Views';


    	$scope.lineDiagramConfig = {
    		dateRange: $rootScope.settings.dateRange,
    		viewIds: $rootScope.settings.viewIds
    	}


    	$scope.changed = true;

        $scope.dataDimension = "month";

        $scope.changeDimension =function(change){
            $scope.dataDimension = change;
        }

        $scope.closePanel = function(){
            console.log("CLOSING PANEL");
            $rootScope.panel && $rootScope.panel.close().then(function() {
                angular.element(document.querySelector('.demo-dialog-open-button')).focus();
            });
        }

    	// Observe date range changes
    	$rootScope.$watch('settings.dateRange', function(newVal, oldVal) {
    		$scope.changed = !$scope.changed;
    		$scope.lineDiagramConfig.dateRange = newVal;

    		console.log("date changed", $scope.lineDiagramConfig.dateRange);

    	}, true);


    	//Observe viewIdChanges
    	$rootScope.$watch('settings.viewIds', function(newVal, oldVal) {
    		$scope.changed = !$scope.changed;
    		$scope.lineDiagramConfig.viewIds = newVal;

    		console.log("viewIds changed", $scope.lineDiagramConfig.viewIds);

    	}, true);

  }]);
