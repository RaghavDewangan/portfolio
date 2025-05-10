import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    
    return data;
}

function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        const first = lines[0];
        const { author, date, time, timezone, datetime } = first;
        
        //calculate line statistics
        const added = lines.filter(d => d.change === '+').length;
        const removed = lines.filter(d => d.change === '-').length;
        const netChange = added - removed;
  
        //create base commit object
        const commitObj = {
          id: commit,
          url: `https://github.com/RaghavDewangan/commit/${commit}`,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
          linesAdded: added,
          linesRemoved: removed,
          netChange,
          filesChanged: [...new Set(lines.map(d => d.file))].length
        };
  
        //add hidden lines array for debugging/advanced analysis
        Object.defineProperty(commitObj, 'lines', {
          value: lines,
          enumerable: false,  //won't show up in console.log/JSON
          configurable: true,
          writable: false
        });
  
        return commitObj;
      });
  }

  function renderCommitInfo(data = [], commits = []) {
    if (!data || !commits) {
      console.error('Invalid data:', { data, commits });
      return;
    }
  
    // Calculate metrics with fallbacks
    const aggStats = calculateAggregates(data);
    const fileCount = new Set(data.map(d => d?.file)).size;
    const stats = {
      totalLOC: data?.length || 0,
      totalCommits: commits?.length || 0,
      totalFiles: fileCount || 0,
      avgFileLength: fileCount ? Math.round(data.length / fileCount) : 0,
      avgLineLength: data.length 
        ? Math.round(d3.mean(data, d => d?.text?.length || 0)) 
        : 0,
      deepestIndent: data.length ? d3.max(data, d => d?.depth || 0) : 0,
    };
  
    // Clear previous content and create container
    const container = d3.select('#stats').html('');
    const dl = container.append('dl').attr('class', 'stats');
  
    // MODIFIED: Updated helper function for single-line layout
    const addMetric = (title, value, tooltip = '') => {
      const div = dl.append('div'); // Wrap each metric in a div
      const dt = div.append('dt');
      if (tooltip) dt.append('abbr').attr('title', tooltip);
      dt.text(title + (tooltip ? ':' : ''));
      div.append('dd').text(value !== undefined ? value : 'N/A');
      return div; // Return the div for potential chaining
    };
  
    // Add metrics (only if we have data)
    if (data.length) {
      addMetric('Total LOC', stats.totalLOC, 'Lines of code');
      addMetric('Total commits:', stats.totalCommits);
      addMetric('Files:', stats.totalFiles);
      addMetric('Avg file size:', `${stats.avgFileLength} lines`);
      addMetric('Longest File:', `${aggStats.extremas.longestFile[1].lines} lines`);
      addMetric('Busiest Period:', `${aggStats.extremas.busiestPeriod[0]}`);
    } else {
      const div = dl.append('div'); // MODIFIED: Wrap the no-data message
      div.append('dt').text('Status');
      div.append('dd').text('No code data available');
    }
}
  
  
  function calculateAggregates(data) {
    if (!data?.length) return null;
  
    // 1. Whole-dataset aggregates
    const wholeDataset = {
      avgLineLength: Math.round(d3.mean(data, d => d.text?.length || 0)),
      longestLine: d3.max(data, d => d.text?.length || 0),
      maxDepth: d3.max(data, d => d.depth || 0),
      avgDepth: Math.round(d3.mean(data, d => d.depth || 0))
    };
  
    // 2. Distinct counts
    const distinct = {
      files: d3.group(data, d => d.file).size,
      authors: d3.group(data, d => d.author).size,
      commitDays: d3.group(data, d => d.date).size
    };
  
    // 3. Grouped aggregates
    const fileStats = d3.rollups(
      data,
      v => ({
        lines: v.length,
        maxDepth: d3.max(v, d => d.depth),
        avgDepth: d3.mean(v, d => d.depth)
      }),
      d => d.file
    );
  
    const grouped = {
      avgFileLength: Math.round(d3.mean(fileStats, d => d[1].lines)),
      avgFileDepth: Math.round(d3.mean(fileStats, d => d[1].avgDepth))
    };
  
    // 4. Min/max with context
    const extremas = {
      longestFile: d3.greatest(fileStats, d => d[1].lines),
      deepestFile: d3.greatest(fileStats, d => d[1].maxDepth),
      busiestPeriod: (() => {
        const byPeriod = d3.rollups(
          data,
          v => v.length,
          d => new Date(d.datetime).toLocaleString('en', { hour: 'numeric', hour12: true })
        );
        return d3.greatest(byPeriod, d => d[1]);
      })(),
      busiestWeekday: (() => {
        const byWeekday = d3.rollups(
          data,
          v => v.length,
          d => new Date(d.datetime).toLocaleString('en', { weekday: 'long' })
        );
        return d3.greatest(byWeekday, d => d[1]);
      })()
    };
  
    return {
      ...wholeDataset,
      ...distinct,
      ...grouped,
      extremas
    };
  }

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 20]);

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);



    const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');
    
    dots
  .selectAll('circle')
  .data(sortedCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', 5)
  .attr('fill', 'steelblue')
  .attr('r', (d) => rScale(d.totalLines))
  .style('fill-opacity', 0.7)
  .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
    renderTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
  })
  .on('mouseleave', () => {
    d3.select(event.currentTarget).style('fill-opacity', 0.7);
    updateTooltipVisibility(false);
  });
}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    tooltip.style.left = `${event.clientX + scrollX}px`;
    tooltip.style.top = `${event.clientY + scrollY}px`; // original code doesnt work, github fix
}

let data = await loadData();

let commits = processCommits(data);

renderCommitInfo(data, commits);

renderScatterPlot(data, commits);