/*
  INTERACTIE ONTWERP B
  --------------------
  Vijf onderdelen:
  1. Het menu op mobiel en tablet (precies hetzelfde als in ontwerp A)
  2. De tijdlijn "focus per moment": vijf tabs, één moment tegelijk in beeld
  3. De leeftijdscheck (dezelfde berekening als in ontwerp A)
  4. De ervaringen die meewaaien als je er met de muis overheen gaat
  5. Cirkels die je kunt verslepen, en die bij scrollen teruggaan naar hun plek

  De pagina werkt ook zonder dit bestand: dan is het menu op mobiel verborgen,
  staan alle momenten onder elkaar en is de leeftijdscheck verborgen.
*/


/* ================= 1. MOBIEL MENU ================= */

const kop = document.querySelector(".kop");
const menuKnop = document.querySelector(".kop__menuknop");
const menu = document.getElementById("hoofdmenu");

// Opent (true) of sluit (false) het menu
function zetMenu(open) {
  // aria-expanded vertelt schermlezers of het menu open is
  menuKnop.setAttribute("aria-expanded", open);
  // De class zorgt in de CSS dat het menu zichtbaar wordt
  kop.classList.toggle("kop--menu-open", open);
}

// Klik op de knop: open als hij dicht is, dicht als hij open is
menuKnop.addEventListener("click", () => {
  const isOpen = menuKnop.getAttribute("aria-expanded") === "true";
  zetMenu(!isOpen);
});

// Escape sluit het menu, en de focus gaat terug naar de knop (toetsenbordgebruikers)
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && kop.classList.contains("kop--menu-open")) {
    zetMenu(false);
    menuKnop.focus();
  }
});

// Klik ergens buiten de balk, of op een link in het menu: menu dicht
document.addEventListener("click", (event) => {
  if (!kop.contains(event.target) || menu.contains(event.target.closest("a"))) {
    zetMenu(false);
  }
});

// Met Tab voorbij het menu gaan: menu dicht
kop.addEventListener("focusout", (event) => {
  if (!kop.contains(event.relatedTarget)) {
    zetMenu(false);
  }
});


/* ================= 2. TIJDLIJN: FOCUS PER MOMENT ================= */
/* Volgens het tabs-patroon van de WAI-ARIA Authoring Practices:
   - de pijltjestoetsen gaan naar de vorige of volgende tab
   - Home en End gaan naar de eerste of laatste tab
   - met Tab ga je van de tabs naar het moment zelf */

const tabLijst = document.querySelector(".momenten__tabs");
const tabs = [...tabLijst.querySelectorAll("button")];
const momenten = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

// Met JavaScript worden de tabs echte tabs. Schermlezers horen dan "tab 2 van 5".
tabLijst.hidden = false;
tabLijst.setAttribute("role", "tablist");
tabs.forEach((tab, index) => {
  tab.setAttribute("role", "tab");
  momenten[index].setAttribute("role", "tabpanel");
  momenten[index].setAttribute("aria-labelledby", tab.id);
  momenten[index].tabIndex = 0;
});

function kiesMoment(gekozen) {
  tabs.forEach((tab, index) => {
    const isGekozen = index === gekozen;
    tab.setAttribute("aria-selected", isGekozen);
    // Alleen de gekozen tab is met Tab bereikbaar, de rest via de pijltjestoetsen
    tab.tabIndex = isGekozen ? 0 : -1;
    momenten[index].hidden = !isGekozen;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => kiesMoment(index));

  tab.addEventListener("keydown", (event) => {
    const laatste = tabs.length - 1;
    const naar = {
      ArrowRight: index === laatste ? 0 : index + 1,
      ArrowDown: index === laatste ? 0 : index + 1,
      ArrowLeft: index === 0 ? laatste : index - 1,
      ArrowUp: index === 0 ? laatste : index - 1,
      Home: 0,
      End: laatste,
    }[event.key];

    if (naar === undefined) return;
    event.preventDefault();      // anders scrolt de pagina mee
    kiesMoment(naar);
    tabs[naar].focus();
  });
});

// Net als in het ontwerp staat "Kom kennismaken" (moment 2) als eerste open
kiesMoment(1);


/* ================= 3. LEEFTIJDSCHECK ================= */
/* Rekent de stappen van de tijdlijn uit voor één kind.
   Alles gebeurt hier in de browser: er wordt niets opgeslagen of verstuurd (AVG). */

const leeftijdscheck = document.querySelector(".leeftijdscheck");
const checkMaand = document.getElementById("check-maand");
const checkJaar = document.getElementById("check-jaar");
const uitkomst = document.querySelector(".leeftijdscheck__uitkomst");

leeftijdscheck.hidden = false;

// Dezelfde stappen als in de tijdlijn, met de leeftijd in maanden
const stappen = [
  { naam: "Oriënteren", maanden: 30, woord: "Rond" },
  { naam: "Kennismaken", maanden: 36, woord: "Rond", belangrijk: true },
  { naam: "Aanmelden", maanden: 36, woord: "Vanaf" },
  { naam: "Wennen", maanden: 46, woord: "In" },
  { naam: "Groep 1 (en BSO)", maanden: 48, woord: "In" },
];

function plusMaanden(datum, maanden) {
  return new Date(datum.getFullYear(), datum.getMonth() + maanden);
}

function alsMaand(datum) {
  return datum.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}

function toonUitkomst() {
  // Nog niet allebei gekozen: de uitkomst blijft leeg (en dus verborgen, zie CSS)
  if (!checkMaand.value || !checkJaar.value) {
    uitkomst.innerHTML = "";
    return;
  }

  const geboorte = new Date(checkJaar.value, checkMaand.value - 1);
  const nu = new Date();
  const dezeMaand = new Date(nu.getFullYear(), nu.getMonth());

  if (geboorte > dezeMaand) {
    uitkomst.innerHTML = "<p>Deze maand ligt in de toekomst. Kies de maand waarin je kind geboren is.</p>";
    return;
  }
  if (plusMaanden(geboorte, 48) <= dezeMaand) {
    uitkomst.innerHTML = "<p>Je kind is al 4 jaar of ouder. Bel ons gerust, dan kijken we samen wat kan.</p>";
    return;
  }

  // Per stap een regel, net als in ontwerp A. Is die maand al bereikt? Dan staat er "Nu".
  const regels = stappen.map((stap) => {
    const datum = plusMaanden(geboorte, stap.maanden);
    const wanneer = datum <= dezeMaand ? "Nu" : `${stap.woord} ${alsMaand(datum)}`;
    const klasse = stap.belangrijk ? ' class="is-belangrijk"' : "";
    return `<li${klasse}><strong>${stap.naam}</strong> <span>${wanneer}</span></li>`;
  });
  uitkomst.innerHTML = `<ol class="leeftijdscheck__lijst">${regels.join("")}</ol>`;
}

checkMaand.addEventListener("change", toonUitkomst);
checkJaar.addEventListener("change", toonUitkomst);


/* ================= 4. MEEWAAIENDE ERVARINGEN ================= */
/* Gaat de muis over een kaart, dan krijgt hij een class die de animatie start (zie CSS).
   Pas als de animatie klaar is gaat de class eraf. Zo zwaait de kaart altijd rustig uit,
   ook als de muis er halverwege al af is. Wie minder beweging wil, ziet niets. */

document.querySelectorAll(".quote").forEach((kaart) => {
  kaart.addEventListener("mouseenter", () => kaart.classList.add("quote--waait"));
  kaart.addEventListener("animationend", () => kaart.classList.remove("quote--waait"));
});


/* ================= 5. VERSLEEPBARE CIRKELS ================= */
/* De ring en de grote stip in elk blok zijn in de CSS ::before en ::after.
   Die kun je niet verslepen, dus hier worden het echte elementen (met dezelfde CSS).
   Alleen met een muis: op een touchscreen zou slepen het scrollen in de weg zitten.
   De cirkels zijn versiering: schermlezers slaan ze over (aria-hidden). */

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll('[class*="blok--stippen-"]').forEach((blok) => {
    const ring = document.createElement("span");
    ring.className = "deco deco--ring";
    const stip = document.createElement("span");
    stip.className = "deco deco--stip";
    ring.setAttribute("aria-hidden", "true");
    stip.setAttribute("aria-hidden", "true");
    blok.prepend(ring);
    blok.append(stip);
    blok.classList.add("deco-los");
  });

  const cirkels = [...document.querySelectorAll(".deco")];
  let gepakt = null;      // de cirkel die je nu vasthoudt
  let start = null;       // waar de muis en de cirkel waren bij het oppakken

  cirkels.forEach((cirkel) => {
    cirkel.classList.add("deco--sleepbaar");

    cirkel.addEventListener("pointerdown", (event) => {
      gepakt = cirkel;
      const [x = 0, y = 0] = (cirkel.style.translate || "0px 0px").split(" ").map(parseFloat);
      start = { muisX: event.clientX, muisY: event.clientY, x, y };
      cirkel.classList.remove("deco--terug");
      cirkel.classList.add("is-gepakt");
      cirkel.setPointerCapture(event.pointerId);   // blijft volgen, ook als de muis even van de cirkel af schiet
      event.preventDefault();                      // geen tekst selecteren tijdens het slepen
    });

    cirkel.addEventListener("pointermove", (event) => {
      if (gepakt !== cirkel) return;
      const x = start.x + event.clientX - start.muisX;
      const y = start.y + event.clientY - start.muisY;
      cirkel.style.translate = `${x}px ${y}px`;
      cirkel.classList.add("is-verplaatst");
    });

    const loslaten = () => {
      if (gepakt !== cirkel) return;
      gepakt = null;
      cirkel.classList.remove("is-gepakt");
    };
    cirkel.addEventListener("pointerup", loslaten);
    cirkel.addEventListener("pointercancel", loslaten);
  });

  // Scrollen: alle verschoven cirkels glijden terug (niet de cirkel die je op dat moment vasthoudt).
  // Na de terugglij-animatie (0,6 s, zie CSS) gaat de cirkel weer onder de inhoud liggen.
  window.addEventListener("scroll", () => {
    cirkels.forEach((cirkel) => {
      if (cirkel === gepakt || !cirkel.style.translate) return;
      cirkel.classList.add("deco--terug");
      cirkel.style.translate = "";
      setTimeout(() => {
        if (!cirkel.style.translate) cirkel.classList.remove("is-verplaatst");
      }, 600);
    });
  }, { passive: true });
}
