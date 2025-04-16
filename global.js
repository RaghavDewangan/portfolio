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
    'afterbegin',
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
    select.value = storedScheme; // update dropdown to match
  }
  
  // 2. Save user selection and apply it
  select.addEventListener('input', function (event) {
    const value = event.target.value;
  
    // Save to localStorage
    localStorage.colorScheme = value;
  
    // Apply theme
    document.documentElement.style.setProperty('color-scheme', value);
    console.log('Color scheme changed to', value);
  });