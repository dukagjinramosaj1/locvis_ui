'use strict';


angular.module('locationAnalyticsApp')
  .controller('ChoardCtrl', function ($scope, ApiService) {

    $scope.dataLoading = true;

    ApiService.getChordMatrix().then(function (matrixData){

      ApiService.getViews().then(function(viewData){

        console.log(getNeighborhood(matrixData["odMatrix"]["viewIds"], viewData));

        matrixData["odMatrix"]["viewNames"] = getNeighborhood(matrixData["odMatrix"]["viewIds"], viewData);
        $scope.matrixData = matrixData;

        console.log(matrixData)

        


        $scope.dataLoading = false;
        
        

      });
    });

    
    function getNeighborhood(selectedViewIds, viewData){
      var neighborhoodData = [];
      

      for(var i = 0; i < selectedViewIds.length; i++){
        var item = {};
        item.id = selectedViewIds[i];
        item.color = "greenyellow";
        item.name = getViewName(selectedViewIds[i], viewData);
        neighborhoodData.push(item);
      }

      return neighborhoodData;

    }

    function getViewName(viewId, viewData){
      for(var j = 0; j < viewData.length; j++){
          if(viewData[j]["_id"] == viewId){
            return viewData[j]["name"];
          }
      }
      return "No Found";
    }
    


  });
