import * as d3 from 'd3';
async function fetchData() {
  const response = await fetch('http://impulse.yadro.msk.ru:8008/data');
  const data = await response.json();
  return data;
}

fetchData().then(data => {
  visualizeData(data);
});

function visualizeData(data) {
  const margin = { top: 40, right: 50, bottom: 65, left: 80 };
  const width = 1260 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const container = d3.select("#charts-container");

  let allEvents = [];
  data.forEach(d => {
      d.sev.forEach(sev => {
          allEvents.push({ date: new Date(d._id), severity: sev });
      });
  });

  const interval = d3.timeHour.every(1);
  const timeFormat = d3.timeFormat("%Y-%m-%d %H:%M");

  const groupedData = d3.rollups(allEvents, v => ({
      count: v.length,
      severityCounts: v.reduce((acc, curr) => {
          acc[curr.severity] = (acc[curr.severity] || 0) + 1;
          return acc;
      }, {0: 0, 1: 0, 2: 0})
  }), d => interval(d.date));

  groupedData.sort((a, b) => d3.ascending(a[0], b[0]));

  const x = d3.scaleTime()
      .domain(d3.extent(groupedData, d => d[0]))
      .range([0, width]);

  const y = d3.scaleLinear()
      .domain([0, d3.max(groupedData, d => d[1].count)])
      .range([height, 0]);

  const svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const tickValues = [];
  const tickInterval = (x.domain()[1] - x.domain()[0]) / 4;
  for (let i = 0; i <= 4; i++) {
      tickValues.push(new Date(x.domain()[0].getTime() + i * tickInterval));
  }

  svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
          .tickValues(tickValues)
          .tickFormat(timeFormat)
      )
      .selectAll("text")
      .attr("dx", "4em")
      .attr("dy", "1em");

  svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

  svg.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "end")
      .attr("x", width/2 + margin.left - 60)
      .attr("y", height + margin.bottom - 20)
      .text("Дата");

  svg.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "end")
      .attr("x", -margin.left)
      .attr("y", -35)
      .attr("transform", "rotate(-90)")
      .text("Количество событий");

  const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  groupedData.forEach(d => {
      let y0 = height;
      ["error", "warn", "info"].forEach(severity => {
          const sevValue = severity === "info" ? 0 : severity === "warn" ? 1 : 2;
          const y1 = y0 - (height - y(d[1].severityCounts[sevValue] || 0));
          const bar = svg.append("rect")
              .attr("class", `bar bar-${severity}`)
              .attr("x", x(d[0]))
              .attr("y", y1)
              .attr("width", width / (groupedData.length * 2) - 2) // Adjusted width
              .attr("height", y0 - y1)
              .on("mouseover", function(event) {
                  tooltip.transition().duration(200).style("opacity", .9);
                  tooltip.html(`Дата: ${timeFormat(d[0])}<br>Количество событий: ${d[1].severityCounts[sevValue] || 0}`)
                      .style("left", (event.pageX + 5) + "px")
                      .style("top", (event.pageY - 28) + "px");
              })
              .on("mouseout", function() {
                  tooltip.transition().duration(500).style("opacity", 0);
              });


          y0 = y1;
      });
  });
}