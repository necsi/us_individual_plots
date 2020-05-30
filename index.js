// Created by Era Iyer
// May 2020
// index.js file
// generates state line chart graph using d3 library 
// resources: https://bl.ocks.org/officeofjane/2c3ed88c4be050d92765de912d71b7c4 for US grid


var csv_arr = []; //global array to hold certain values from csv file
fillArr();  //populates csv array [{id, change, old_color},{id, change, old_color},{id, change, old_color},...]

var margin = {top:20, right:20, bottom:20, left:20},
  width = window.innerWidth - margin.left - margin.right,
  height = window.innerHeight - margin.top - margin.bottom;


// calculate cellSize based on dimensions of svg
var cols = 13;
var rows = 8;
var cellSize = calcCellSize(width, height, cols, rows);

// generate grid data with specified number of columns and rows
var gridData = gridData(13, 8, cellSize);

d3.select("#vis")
  .attr("align","center");

var svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var g_svg = d3.select("#graphModal")
     .append("svg")
     .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
    
// draw gridlines
var grid = svg.append("g")
    .attr("class", "gridlines")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var row = grid.selectAll(".row")
    .data(gridData)
    .enter()
    .append("g")
    .attr("class", "row");

var column = row.selectAll(".cell")
    .data(function(d) { return d; })
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", function(d) { return d.x + width/cols; }) 
    .attr("y", function(d) { return d.y; })
    .attr("width", function(d) { return d.width; })
    .attr("height", function(d) { return d.height; })
    .style("fill", "white");
    

var gridMap = svg.append("g")
    .attr("class", "gridmap")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.queue()
    .defer(d3.csv, "publication-grids.csv")
    .defer(d3.csv, "links.csv")
    .await(ready);

function ready(error, data, links) {

    var nest = d3.nest()
        .key(function(d) { return d.publication; })
        .entries(data);
    
    // drawing grid map
    drawGridMap(links[0].publication);

    // function to create initial map
    function drawGridMap(publication) {
      // filter data to return the object of publication of interest
      var selectPub = nest.find(function(d) {
        return d.key == publication;
    });


    // use a key function to bind rects to states
    var states = gridMap.selectAll(".state")
        .data(selectPub.values, function(d) { return d.code; });
    // draw state rects
    states.enter()
        .append("rect")
          .attr("class", function(d) {return "state " + d.code; })
          .attr("x", function(d) { return width/cols+(d.col - 1) * cellSize; })
          .attr("y", function(d) { return (d.row - 1) * cellSize; })
          .attr("width", cellSize)
          .attr("height", cellSize)
          .on("click", function(d) {
            var square = d3.select(this);
            square.classed("active", !square.classed("active"));
            if (square.classed("active")) {
              d3.json("https://raw.githubusercontent.com/obuchel/classification/master/classification/data2_8.json", function(data) {
                var selectedIndex = data.findIndex(obj => obj.province==d.state);
                var id = data[selectedIndex].id;
                let color = getColor(id); //determines appropriate color based on id 
                popUpGraph(d.state, color);
              });
           }
          });

    var labels = gridMap.selectAll(".label")
        .data(selectPub.values, function(d) { return d.code; });

    // add state labels
    labels.enter()
        .append("text")
          .attr("class", function(d) { return "label " + d.code; })
          .attr("x", function(d) {
            return (width/cols + (d.col - 1) * cellSize) + (cellSize / 2 - margin.left);
          })
          .attr("y", function(d) {
            return ((d.row - 1) * cellSize) + (cellSize /2 - margin.top);
          })
          .style("text-anchor", "middle")
          .text(function(d) { return d.code; });

          var labels = gridMap.selectAll(".label")
        .data(selectPub.values, function(d) { return d.code; });

    var map = gridMap.selectAll(".map")
      .data(selectPub.values, function(d) { return d.code; });

    // graphs for each state 
    map.enter()
        .append("svg")
          .attr("stateMap", function(d) {           
            d3.json("https://raw.githubusercontent.com/obuchel/classification/master/classification/data2_8.json", function(data) {
              var selectedIndex = data.findIndex(obj => obj.province==d.state);
              var id = data[selectedIndex].id;
              var color = getColor(id); //determines appropriate color based on preloaded csv file
              x = ((d.col - 1) * cellSize) + (cellSize / 2 - 10);
              y = ((d.row - 1) * cellSize) + (cellSize /2 - 10);
              populate(x+width/cols, y, d.state, color);
            });
          })
  }
};

/*
* getColor: determines corresponding color based on the id given. If there is a change
*           in color, it returns the changed color, else returns the old color
*/
function getColor(id){
  for(var i = 0; i < csv_arr.length; i ++){
    if(csv_arr[i][0] == id){ //find correct province given id 
      if(csv_arr[i][1] == ""){  //check if Change is empty 
        return csv_arr[i][2];   //if no change, return old color
      }
      else{
        return csv_arr[i][1];   //if change, return changed color
      }
    }
  }
}

/*
* popUpGraph: takes in stateName and generates Modal with graph of 
*             the state selected
*/
function popUpGraph(stateName, color) {
    var modal = document.getElementById("myModal");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    //if 'x' button clicled, hide modal and reset g_svg
    span.onclick = function() {
      modal.style.display = "none";
      d3.selectAll("#graphModal > *").remove(); 
      g_svg = d3.select("#graphModal")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("align","center");
    }
    //if non-modal section clicled, hide modal and reset g_svg
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
        d3.selectAll("#graphModal > *").remove(); 
        g_svg = d3.select("#graphModal")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("align","center");
        
      }
    }

    modal.style.display = "block";

    //setting svg height, width, and margin values
    var w = 700,
        h = 400,
        padding = 50;

   
    //opening json file to read data only from the selected index 
    d3.json("https://raw.githubusercontent.com/obuchel/classification/master/classification/data2_8.json", function(data) {
      //determine index from JSON corresponding to state name
      var selectedIndex = data.findIndex(obj => obj.province==stateName);
      const dataset = [];

      var dates = data[selectedIndex].dates;  
      let id = data[selectedIndex].id;

      for(var i = 0; i < data[selectedIndex].dates.length; i++){
          //pushes date and value into array, similar to x, y coordinates on a graph
          dataset.push({ x : d3.timeParse("%m/%d/%y")(data[selectedIndex].dates[i]), y : data[selectedIndex].value[i] }); 
      }
      // setting time scale for x axis based on dates  
      var xScale = d3.scaleTime()
          .domain(d3.extent(dataset, function(d) { return d.x; }))
          .range([padding, w - padding]); //taking into account margins

      // setting linear scale for y axis based on max value 
      var yScale = d3.scaleLinear()
          .domain([0, d3.max(dataset, function (d) { return d.y; })])
          .range([h - padding, padding]);

      var xAxis = d3.axisBottom(xScale);
      var yAxis = d3.axisLeft(yScale);

      //draw x axis in modal
      g_svg.append("g")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

      //draw y axis in modal
      g_svg.append("g")
        .attr("transform", "translate("+padding+",0)")
        .call(yAxis);

      //add title to graph
      g_svg.append("text")     
        .attr("transform",
                "translate(" + (w/2) + " ," + 
                            (padding-20) + ")")
        .style("text-anchor", "middle")
        .text(data[selectedIndex].province)
        .style("font-size", "24px")
        .style("fill", "#696969");
    
      //draw line and path 
      const line = d3.line()
        .x(function(d) { return xScale(d.x) })
        .y(function(d) { return yScale(d.y) })

      g_svg.append("path")
        .datum(dataset)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.15)
        .attr("d", line)

      var div = d3.select("#graphInfo").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      //place dots to represent all x y coordinates 
      g_svg
        .append("g")
        .selectAll("dot")
        .data(dataset)
        .enter()
        .append("circle")
            .attr("cx", function(d) { return xScale(d.x) } )
            .attr("cy", function(d) { return yScale(d.y) } )
            .attr("r", 2.5)
            .attr("fill", color)

            //interactive feature to see new cases per day
            .on('mouseover', function (d, i) {
              d3.select(this).transition()
                    .duration('100')
                    .attr("r", 7);
              div.transition()
                    .duration(100)
                    .style("opacity", 1);
              div.html((Math.round(d.y))+" new cases on "+ d3.timeFormat("%B %d")(d.x))
                    .style("font-size", "14px");
            })
            .on('mouseout', function (d, i) {
              d3.select(this).transition()
                  .duration('200')
                  .attr("r", 2.5);
              div.transition()
                  .duration('200')
                  .style("opacity", 0);
            });

      });
  }

/*
* fillArr: reads csv file and populates csv_arr with all id, change, and old color values.
*          *This process of preloading is to get around the asynchronous javascript process*
*/
function fillArr(){
  d3.csv("https://raw.githubusercontent.com/obuchel/COVID-19_map/master/classification/classification_ids2.csv", function(data) {
    for(var i = 1; i < data.length; i++){
      csv_arr.push([data[i].id, data[i].Change, data[i].color_old]); //id, change, old color
    }
  });
}
 
/*
* gridData: function that generates a nested array for square grid
*/
function gridData(ncol, nrow, cellsize) {
  var gridData = [];
  var xpos = 1;  // starting xpos and ypos at 1 so the stroke will show when we make the grid below 
  var ypos = 1;

  // calculate width and height of the cell based on width and height of the canvas
  var cellSize = cellsize;

  // iterate for rows
  for (var row = 0; row < nrow; row++) {
    gridData.push([]);
    
    // iterate for cells/columns inside each row
    for (var col = 0; col < ncol; col++) {
      gridData[row].push({
        x: xpos,
        y: ypos,
        width: cellSize,
        height: cellSize
      });
      
      // increment x position (moving over by 50)
      xpos += cellSize;
    }
    
    // reset x position after a row is complete
    xpos = 1;
    // increment y position (moving down by 50)
    ypos += cellSize;
  }
  return gridData;
}


/*
* gridData: function to calculate grid cell size based on width and height of svg
*/
function calcCellSize(w, h, ncol, nrow) {
  // leave tiny space in margins
  var gridWidth  = w - 2;
  var gridHeight = h - 2;
  var cellSize;

  // calculate size of cells in columns across
  var colWidth = Math.floor(gridWidth / ncol);
  // calculate size of cells in rows down
  var rowWidth = Math.floor(gridHeight / nrow);

  // take the smaller of the calculated cell sizes
  if (colWidth <= rowWidth) {
    cellSize = colWidth;
  } else {
    cellSize = rowWidth;
  }
  return cellSize;
}

/*
* populate: generates graph for state given and translates axes and coordinates
*           based on x y position
*/
function populate(x, y, state, color){

    var w = cellSize*.75,
        h = cellSize*.75,
        margin = { top: 0, right: 7, bottom: 0, left: 7 };

    d3.json("https://raw.githubusercontent.com/obuchel/classification/master/classification/data2_8.json", function(data) {
      //determine index from JSON corresponding to state name
      var selectedIndex = data.findIndex(obj => obj.province==state);

      const dataset = [];

      var dates = data[selectedIndex].dates;  
      for(var i = 0; i < data[selectedIndex].dates.length; i++){
          //pushes date and value into array, similar to x, y coordinates on a graph
          dataset.push({ x : d3.timeParse("%m/%d/%y")(data[selectedIndex].dates[i]), y : data[selectedIndex].value[i] }); 
      }

      // setting time scale for x axis based on date
      var xScale = d3.scaleTime()
          .domain(d3.extent(dataset, function(d) { return d.x; }))
          .range([0,w]); //taking into account margins

      // setting linear scale for y axis based on max value 
      var yScale = d3.scaleLinear()
          .domain([0, d3.max(dataset, function (d) { return d.y + 1; })])
          .range([h, margin.top]);

      var xAxis = d3.axisBottom(xScale).tickValues([]);
      var yAxis = d3.axisLeft(yScale).tickValues([]);

      svg.append("g")
        .attr("transform", "translate(" + [x,y+h] + ")")  //translate x axis based on x and y position
        .call(xAxis);

        const line = d3.line()
          .x(function(d) { return xScale(d.x) })
          .y(function(d) { return yScale(d.y) })

        d3.select("svg").append("path")
          .datum(dataset)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1.15)
          .attr("transform", "translate(" + [x,y] + ")")  //translate line based on x and y position
          .attr("d", line)
  });
}

