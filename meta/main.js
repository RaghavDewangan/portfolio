import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;
let commitProgress = 100;
let commitMaxTime;
let filteredCommits = [];

const slider = document.getElementById('commit-slider');
const timeDisplay = document.getElementById('commit-max-time');

async function loadData() {
  const data = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const { author, date, time, timezone, datetime } = first;
    const added = lines.filter(d => d.change === '+').length;
    const removed = lines.filter(d => d.change === '-').length;

    const commitObj = {
      id: commit,
      url: `https://github.com/RaghavDewangan/commit/${commit}`,
      author, date, time, timezone, datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
      linesAdded: added,
      linesRemoved: removed,
      netChange: added - removed,
      filesChanged: [...new Set(lines.map(d => d.file))].length
    };

    Object.defineProperty(commitObj, 'lines', {
      value: lines,
      enumerable: false,
      configurable: true,
      writable: false
    });

    return commitObj;
  });
}

function filterCommitsByTime() {
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
}

function updateCommitSliderUI() {
  commitProgress = Number(slider.value);
  commitMaxTime = timeScale.invert(commitProgress);
  timeDisplay.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short'
  });
  filterCommitsByTime();
  renderCommitInfo(data, filteredCommits);
  updateScatterPlot(data, filteredCommits);
}

function renderCommitInfo(data, commits) {
  const container = d3.select('#stats').html('');
  const dl = container.append('dl').attr('class', 'stats');

  const addMetric = (title, value) => {
    const div = dl.append('div');
    div.append('dt').text(title);
    div.append('dd').text(value !== undefined ? value : 'N/A');
    return div;
  };

  const fileGroups = d3.rollups(data, v => v.length, d => d.file);
  const busiestPeriod = (() => {
    const byHour = d3.rollups(
      commits,
      v => v.length,
      d => new Date(d.datetime).toLocaleString('en', { hour: 'numeric', hour12: true })
    );
    const max = d3.greatest(byHour, d => d[1]);
    return max ? max[0] : 'N/A';
  })();

  addMetric('Total LOC', data.length);
  addMetric('Total Commits', commits.length);
  addMetric('Files', new Set(data.map(d => d.file)).size);
  addMetric('Avg file size', `${Math.round(d3.mean(fileGroups, d => d[1]))} lines`);
  addMetric('Longest File', `${d3.max(fileGroups, d => d[1])} lines`);
  addMetric('Busiest Period', busiestPeriod);
}

function updateScatterPlot(data, commitsToUse) {
  const width = 1000, height = 600, margin = { top: 10, right: 10, bottom: 30, left: 20 };

  d3.select('#chart').selectAll('svg').remove();

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale = d3.scaleTime()
    .domain(d3.extent(commitsToUse, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2, '0')}:00`);

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const [minLines, maxLines] = d3.extent(commitsToUse, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 20]);

  createBrushSelector(svg);

  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(commitsToUse)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      d3.selectAll('circle').style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  if (!commit) return;
  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime.toLocaleString('en', { dateStyle: 'full' });
}

function updateTooltipVisibility(show) {
  document.getElementById('commit-tooltip').hidden = !show;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', d => isCommitSelected(selection, d));
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const dateMin = xScale.invert(x0);
  const dateMax = xScale.invert(x1);
  const hourMin = yScale.invert(y1);
  const hourMax = yScale.invert(y0);
  return commit.datetime >= dateMin && commit.datetime <= dateMax && commit.hourFrac >= hourMin && commit.hourFrac <= hourMax;
}

function renderSelectionCount(selection) {
  const selected = selection ? filteredCommits.filter(d => isCommitSelected(selection, d)) : [];
  document.getElementById('selection-count').textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection) {
  const selected = selection ? filteredCommits.filter(d => isCommitSelected(selection, d)) : [];
  const container = document.getElementById('language-breakdown');
  if (!selected.length) return container.innerHTML = '';
  const lines = selected.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);
  container.innerHTML = '';
  for (const [lang, count] of breakdown) {
    const percent = d3.format('.1~%')(count / lines.length);
    container.innerHTML += `<dt>${lang}</dt><dd>${count} lines (${percent})</dd>`;
  }
}

const data = await loadData();
const commits = processCommits(data);
const timeScale = d3.scaleTime(
  [d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)],
  [0, 100]
);
commitMaxTime = timeScale.invert(commitProgress);

slider.addEventListener('input', updateCommitSliderUI);
renderCommitInfo(data, commits);
filterCommitsByTime();
updateScatterPlot(data, filteredCommits);
updateCommitSliderUI();
