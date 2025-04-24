console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: 'index.html', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'resume/cv.html', title: 'Resume' },
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'https://github.com/RaghavDewangan', title: 'GitHub' },
];

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith("http") ? BASE_PATH + url : url;

  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
    'beforeend',
    `
    <label class="color-scheme" style="display: block; margin-bottom: 1rem;">
      Theme:
      <select id="theme-select">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );


  const select = document.querySelector('#theme-select');

  // 1. Apply stored color scheme on page load
  if ("colorScheme" in localStorage) {
    const storedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', storedScheme);
    select.value = storedScheme;
  }
  
  select.addEventListener('input', function (event) {
    const value = event.target.value;
  
    localStorage.colorScheme = value;
  
    document.documentElement.style.setProperty('color-scheme', value);
    console.log('Color scheme changed to', value);
  });

  export async function fetchJSON(url) {
    try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      // console.log(response)
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = await response.json();
      //console.log(data);
      return data;

    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
    }
  }

  // fetchJSON('../lib/projects.json')
  // .then(data => console.log(data))
  // .catch(error => console.error('Error loading data:', error));

  export function renderProjects(projects, containerElement, headingLevel = 'h2') {

    if (!containerElement) {
      console.error('Invalid container element');
      return;
    }

    containerElement.innerHTML = '';

    const projectsTitle = document.querySelector('.projects-title');

    if (projectsTitle) {
      projectsTitle.textContent = `${projects.length} Projects`;
    }

    projects.forEach(project => {
      const article = document.createElement('article');
      const heading = document.createElement(headingLevel);
      heading.textContent = project.title;

      const date = document.createElement('p');
      date.textContent = `Project Date: ${project.year}`;

      article.innerHTML = `
        ${heading.outerHTML}
        <img src="${project.image || 'default-image.jpg'}" alt="${project.title || 'Untitled Project'}">
        <p>${project.description || 'No description available'}</p>
      `;

      containerElement.appendChild(article);
    });
  }

  // async function fetchAndRenderProjects() {
  //   try {
  //     const projects = await fetchJSON('../lib/projects.json');
  //     if (projects && Array.isArray(projects)) {
  //       console.log('Projects:', projects);
  //       const projectsContainer = document.querySelector('.projects');
  //       renderProjects(projects, projectsContainer, 'h2');
  //     } else {
  //       console.error('Projects data is not valid:', projects);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching projects:', error);
  //   }
  // }
  
  // fetchAndRenderProjects();

  export async function fetchGithubData(username){
    return fetchJSON(`https://api.github.com/users/${username}`);
  }