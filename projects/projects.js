import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

//initialize visualization
renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

//search functionality
searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    const filteredProjects = projects.filter(project => {
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });
    
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
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

    //process data
    const rolledData = d3.rollups(
        projectsData,
        v => v.length,
        d => d.year
    );

    const data = rolledData.map(([year, count]) => ({
        label: String(year),
        value: count
    }));

    //set up pie chart
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);
    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    //draw arcs
    arcData.forEach((d, i) => {
        d3.select('#projects-pie-plot')
            .append('path')
            .attr('d', arcGenerator(d))
            .attr('fill', colors(i));
    });

    //draw legend
    const legend = d3.select('.legend');
    data.forEach((d, idx) => {
        legend.append('li')
            .attr('class', 'legend-item')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> <span class="legend-label">${d.label}</span> <span class="legend-value">(${d.value})</span>`);
    });
}