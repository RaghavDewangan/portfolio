console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: "../index.html", title: "Home" },
  { url: "../projects/index.html", title: "Projects" },
  { url: "../contact/index.html", title: "Contact" },
  { url: "../resume/cv.html", title: "Resume" },
  { url: "https://github.com/RaghavDewangan", title: "My Github!" },
];

let nav = document.createElement("nav");
let ul = document.createElement("ul");
nav.appendChild(ul);
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  let li = document.createElement("li");
  li.appendChild(a);
  ul.appendChild(li);
}
