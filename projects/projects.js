import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

//state variables
let selectedIndex = -1;
let currentQuery = '';
let data = []; // Stores pie chart data for year filtering

//initialize visualization
renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

//search functionality (now updates combined filters)
searchInput.addEventListener('input', (event) => {
    currentQuery = event.target.value.toLowerCase();
    applyFilters();
});

function renderPieChart(projectsData) {
    //clear previous visualization
    d3.select('#projects-pie-plot').selectAll('*').remove();
    d3.select('.legend').selectAll('*').remove();

    //don't render if no data
    if (projectsData.length === 0) {
        d3.select('#projects-pie-plot')
            .append('text')
            .text('No projects to display')
            .attr('text-anchor', 'middle')
            .attr('fill', '#666');
        return;
    }

    //process data (store year for filtering)
    const rolledData = d3.rollups(
        projectsData,
        v => v.length,
        d => d.year
    );

    data = rolledData.map(([year, count]) => ({
        label: String(year),
        value: count,
        year: year //store actual year value
    }));

    //set up pie chart
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);
    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    //draw arcs with click handlers
    arcData.forEach((d, i) => {
        d3.select('#projects-pie-plot')
            .append('path')
            .attr('d', arcGenerator(d))
            .attr('fill', colors(i))
            .attr('class', () => selectedIndex === i ? 'selected' : '')
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;
                updateSelection();
            });
    });

    //draw legend with click handlers
    const legend = d3.select('.legend');
    data.forEach((d, idx) => {
        legend.append('li')
            .attr('class', () => `legend-item ${selectedIndex === idx ? 'selected' : ''}`)
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> <span class="legend-label">${d.label}</span> <span class="legend-value">(${d.value})</span>`)
            .on('click', () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                updateSelection();
            });
    });
}

//updates visual selection state
function updateSelection() {
    //update pie wedges
    d3.select('#projects-pie-plot')
        .selectAll('path')
        .attr('class', (_, i) => selectedIndex === i ? 'selected' : '');

    //update legend items
    d3.select('.legend')
        .selectAll('li')
        .attr('class', (_, i) => `legend-item ${selectedIndex === i ? 'selected' : ''}`);

    applyFilters(); //apply combined filters
}

//applies both search AND year filters
function applyFilters() {
    let filteredProjects = projects;

    //apply search filter
    if (currentQuery) {
        filteredProjects = filteredProjects.filter(project => 
            Object.values(project).join('\n').toLowerCase().includes(currentQuery)
        );
    }

    //apply year filter (if wedge is selected)
    if (selectedIndex !== -1 && data[selectedIndex]) {
        const selectedYear = data[selectedIndex].year;
        filteredProjects = filteredProjects.filter(project => 
            project.year === selectedYear
        );
    }

    renderProjects(filteredProjects, projectsContainer, 'h2');
}