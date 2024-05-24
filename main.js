import * as d3 from 'd3';

async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}

fetchData().then(data => {
  visualizeData(data);
});

function visualizeData(data) {
  const margin = {top: 20, right: 30, bottom: 40, left: 40};
  const width = 960 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  const container = d3.select("#charts-container");

  data.forEach((d, i) => {
    const chartDiv = container.append("div").attr("class", "chart");

    chartDiv.append("h3").text(`Объект ${i + 1}: Дата ${new Date(d._id).toLocaleString()}`);

    const svg = chartDiv.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Группировка событий по критичности
    const severityCounts = d.sev.reduce((acc, sev) => {
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {});

    const severities = [0, 1, 2];
    const counts = severities.map(sev => severityCounts[sev] || 0);

    const x = d3.scaleBand()
      .domain(severities)
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(counts)])
      .range([height, 0]);

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(sev => `Severity ${sev}`));

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    svg.selectAll(".bar")
      .data(severities)
      .enter().append("rect")
      .attr("class", sev => sev === 2 ? "bar bar-error" : sev === 1 ? "bar bar-warn" : "bar bar-info")
      .attr("x", sev => x(sev))
      .attr("y", sev => y(counts[sev]))
      .attr("width", x.bandwidth())
      .attr("height", sev => height - y(counts[sev]))
      .on("mouseover", function(event, sev) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`Дата: ${new Date(d._id).toLocaleString()}<br>Количество событий: ${counts[sev]}`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  });
}
