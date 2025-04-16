console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// STEP 3.1: Define your site pages
let pages = [
    { url: 'index.html', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    { url: 'resume/cv.html', title: 'Resume' },
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'https://github.com/RaghavDewangan', title: 'GitHub' },
];

// STEP 3.1.5: Set base path for local vs GitHub Pages
const BASE_PATH =
  location.hostname === "raghavdewangan.github.io" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/"; // Replace "website" with your actual GitHub repo name

// STEP 3.2: Create nav and inject into body
let nav = document.createElement("nav");
document.body.prepend(nav);

// STEP 3.3: Loop through pages and create links
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Add base path for internal links (not external ones)
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  // Create <a> tag
  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  // Highlight current page link
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}