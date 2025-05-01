import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
let selectedIndex = -1;

// Initialize visualization
renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

// Search functionality
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
    // Clear previous visualization
    d3.select('#projects-pie-plot').selectAll('*').remove();
    d3.select('.legend').selectAll('*').remove();

    // Don't render if no data
    if (projectsData.length === 0) {
        d3.select('#projects-pie-plot')
            .append('text')
            .text('No projects to display')
            .attr('text-anchor', 'middle')
            .attr('fill', '#666');
        return;
    }

    // Process data
    const rolledData = d3.rollups(
        projectsData,
        v => v.length,
        d => d.year
    );

    const data = rolledData.map(([year, count]) => ({
        label: String(year),
        value: count,
        year: year // Store the actual year value
    }));

    // Set up pie chart
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);
    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Draw arcs with click handlers
    arcData.forEach((d, i) => {
        d3.select('#projects-pie-plot')
            .append('path')
            .attr('d', arcGenerator(d))
            .attr('fill', colors(i))
            .attr('class', () => selectedIndex === i ? 'selected' : '')
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;
                updateSelection(data);
            });
    });

    // Draw legend with click handlers
    const legend = d3.select('.legend');
    data.forEach((d, idx) => {
        legend.append('li')
            .attr('class', () => `legend-item ${selectedIndex === idx ? 'selected' : ''}`)
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> <span class="legend-label">${d.label}</span> <span class="legend-value">(${d.value})</span>`)
            .on('click', () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                updateSelection(data);
            });
    });

    // Update selection state and filter projects
    function updateSelection(data) {
        // Update pie wedges
        d3.select('#projects-pie-plot')
            .selectAll('path')
            .attr('class', (_, i) => selectedIndex === i ? 'selected' : '');

        // Update legend items
        d3.select('.legend')
            .selectAll('li')
            .attr('class', (_, i) => `legend-item ${selectedIndex === i ? 'selected' : ''}`);

        // Filter projects based on selection
        if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2');
        } else {
            const selectedYear = data[selectedIndex].year;
            const filteredProjects = projects.filter(project => project.year === selectedYear);
            renderProjects(filteredProjects, projectsContainer, 'h2');
        }
    }
}