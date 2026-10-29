/*
  INTERACTIE
  ----------
  Drie onderdelen:
  1. Het menu op mobiel en tablet openen en sluiten
  2. De sticky knop onderin het scherm tonen en verbergen (FR-08)
  3. Het formulier controleren, met eigen foutmeldingen in gewone taal (B1)

  De pagina werkt ook zonder dit bestand: dan is het menu op mobiel verborgen
  en controleert de browser zelf het formulier.
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


/* ================= 2. STICKY KNOP ================= */
/* De knop is alleen nodig als er geen andere knop in beeld is:
   - de knoppen in de hero zijn al voorbij (weggescrold naar boven)
   - en het formulier is niet in beeld (daar heb je de knop niet nodig) */

const stickyKnop = document.querySelector(".sticky-cta");
const heroKnoppen = document.querySelector(".hero__acties");
const formulierSectie = document.getElementById("kennismaken");

function werkStickyKnopBij() {
  // getBoundingClientRect() geeft de plek van een onderdeel ten opzichte van het scherm
  const hero = heroKnoppen.getBoundingClientRect();
  const form = formulierSectie.getBoundingClientRect();

  const heroVoorbij = hero.bottom < 0;
  const formulierInBeeld = form.top < window.innerHeight && form.bottom > 0;

  stickyKnop.classList.toggle("sticky-cta--zichtbaar", heroVoorbij && !formulierInBeeld);
}

// Bij elke scrollbeweging en als het scherm van formaat verandert opnieuw bekijken.
// "passive" vertelt de browser dat we het scrollen niet tegenhouden: dat scrolt soepeler.
window.addEventListener("scroll", werkStickyKnopBij, { passive: true });
window.addEventListener("resize", werkStickyKnopBij);
werkStickyKnopBij();


/* ================= 3. FORMULIEREN ================= */
/* Twee formulieren met dezelfde soort controles: kennismaken en de herinnering.
   Daarom staan de meldingen en de controle hieronder één keer, en gebruiken
   beide formulieren ze. */

// Meldingen die in allebei de formulieren voorkomen
function meldingEmail(veld) {
  const email = veld.value.trim();
  if (!email) return "Vul je e-mailadres in.";
  // Simpele check: iets, dan een @, dan iets met een punt erin
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Dit e-mailadres klopt nog niet. Het ziet er zo uit: naam@voorbeeld.nl";
  }
  return "";
}

function meldingGeboorte(maandVeld, jaarVeld) {
  if (!maandVeld.value || !jaarVeld.value) {
    return "Kies de maand en het jaar waarin je kind geboren is.";
  }
  // new Date(jaar, maand) telt maanden vanaf 0, daarom maand - 1
  if (new Date(jaarVeld.value, maandVeld.value - 1) > new Date()) {
    return "Deze maand ligt in de toekomst. Kies de maand waarin je kind geboren is.";
  }
  return "";
}

/* Zet de controle aan op een formulier.
   - formulier:    het <form>
   - controles:    een lijst met per controle:
                   velden  = welke velden erbij horen (die krijgen een rode rand bij een fout)
                   fout    = het id van de plek waar de melding komt
                   melding = een functie die de foutmelding geeft, of "" als alles goed is
   - alsHetKlopt:  wat er gebeurt als alles goed is ingevuld */
function zetControleAan(formulier, controles, alsHetKlopt) {
  // De browser hoeft niet meer zelf te controleren: dat doen we hier, met betere teksten
  formulier.noValidate = true;

  // Voert één controle uit en toont of verbergt de melding. Geeft true als alles goed is.
  function controleer(controle) {
    const melding = controle.melding();
    document.getElementById(controle.fout).textContent = melding;
    controle.velden.forEach((veld) => {
      // aria-invalid: schermlezers melden "ongeldig", en de CSS maakt de rand rood
      if (melding) {
        veld.setAttribute("aria-invalid", "true");
      } else {
        veld.removeAttribute("aria-invalid");
      }
    });
    return melding === "";
  }

  // Wordt true na de eerste klik op de knop. Pas dan controleren we ook tijdens het invullen,
  // anders krijg je al een foutmelding voordat je klaar bent met typen.
  let alGeprobeerd = false;

  controles.forEach((controle) => {
    controle.velden.forEach((veld) => {
      // Tijdens het typen: een bestaande melding verdwijnt zodra het goed is
      veld.addEventListener("input", () => {
        if (veld.hasAttribute("aria-invalid")) controleer(controle);
      });
      // Na het verlaten of kiezen van een veld: opnieuw controleren
      veld.addEventListener("change", () => {
        if (alGeprobeerd) controleer(controle);
      });
    });
  });

  formulier.addEventListener("submit", (event) => {
    // Niet het formulier versturen: dat bepalen we zelf
    event.preventDefault();
    alGeprobeerd = true;

    // Alle controles uitvoeren en de foute bewaren
    const fout = controles.filter((controle) => !controleer(controle));

    if (fout.length > 0) {
      // Focus naar het eerste veld met een fout. Een schermlezer leest dan het label
      // én de foutmelding voor (via aria-describedby).
      fout[0].velden[0].focus();
      return;
    }
    alsHetKlopt();
  });
}


/* ---------- Formulier 1: kennismaken ---------- */

const kennismaken = document.querySelector(".formulier--kennismaken");
// formulier.elements geeft alle velden, op naam. Bijvoorbeeld: velden.voornaam
const velden = kennismaken.elements;

zetControleAan(kennismaken, [
  {
    velden: [velden.voornaam],
    fout: "voornaam-fout",
    melding: () => velden.voornaam.value.trim() ? "" : "Vul je voornaam in.",
  },
  {
    velden: [velden.achternaam],
    fout: "achternaam-fout",
    melding: () => velden.achternaam.value.trim() ? "" : "Vul je achternaam in.",
  },
  {
    velden: [velden.email],
    fout: "email-fout",
    melding: () => meldingEmail(velden.email),
  },
  {
    velden: [velden.telefoon],
    fout: "telefoon-fout",
    melding: () => {
      // Spaties, streepjes en haakjes mogen. We kijken alleen naar de cijfers.
      const nummer = velden.telefoon.value.replace(/[\s()-]/g, "");
      if (!nummer) return "";   // niet verplicht: leeg is goed
      return /^\+?\d{10,13}$/.test(nummer)
        ? ""
        : "Dit telefoonnummer klopt nog niet. Bijvoorbeeld: 06 12345678";
    },
  },
  {
    velden: [velden.geboortemaand, velden.geboortejaar],
    fout: "geboorte-fout",
    melding: () => meldingGeboorte(velden.geboortemaand, velden.geboortejaar),
  },
  {
    velden: [...velden.moment],   // alle drie de rondjes
    fout: "moment-fout",
    melding: () => velden.moment.value ? "" : "Kies wanneer je het liefst komt.",
  },
  {
    velden: [velden.toestemming],
    fout: "toestemming-fout",
    melding: () => velden.toestemming.checked
      ? ""
      : "Zet een vinkje bij toestemming. Anders kunnen we geen kennismaking plannen.",
  },
], () => {
  // Alles klopt. GitHub Pages kan geen gegevens ontvangen, dus we sturen niets op
  // en gaan direct naar de bedankpagina. Zo komen er ook geen gegevens in de adresbalk.
  // In het echte CMS worden de gegevens hier naar de school verzonden.
  window.location.href = kennismaken.getAttribute("action");
});


/* ---------- Formulier 2: herinnering ---------- */

const herinnering = document.querySelector(".formulier--herinnering");
const herinneringVelden = herinnering.elements;
const herinneringKlaar = document.querySelector(".herinnering__klaar");

zetControleAan(herinnering, [
  {
    velden: [herinneringVelden.email],
    fout: "herinnering-email-fout",
    melding: () => meldingEmail(herinneringVelden.email),
  },
  {
    velden: [herinneringVelden.geboortemaand, herinneringVelden.geboortejaar],
    fout: "herinnering-geboorte-fout",
    melding: () => meldingGeboorte(herinneringVelden.geboortemaand, herinneringVelden.geboortejaar),
  },
  {
    velden: [herinneringVelden.toestemming],
    fout: "herinnering-toestemming-fout",
    melding: () => herinneringVelden.toestemming.checked
      ? ""
      : "Zet een vinkje bij toestemming. Anders kunnen we je geen herinnering sturen.",
  },
], () => {
  // Alles klopt: het formulier verdwijnt en de bevestiging verschijnt.
  // De focus gaat naar de bevestiging, zodat een schermlezer hem meteen voorleest.
  // In het echte CMS gaat hier de bevestigingsmail (double opt-in) de deur uit.
  herinnering.hidden = true;
  herinneringKlaar.hidden = false;
  herinneringKlaar.focus();
});


/* ================= 4. LEEFTIJDSCHECK ================= */
/* Rekent de stappen van de tijdlijn uit voor één kind.
   Alles gebeurt hier in de browser: er wordt niets opgeslagen of verstuurd (AVG). */

const leeftijdscheck = document.querySelector(".leeftijdscheck");
const checkMaand = document.getElementById("check-maand");
const checkJaar = document.getElementById("check-jaar");
const uitkomst = document.querySelector(".leeftijdscheck__uitkomst");

// Zonder JavaScript is de check verborgen (hidden). Nu JavaScript werkt, tonen we hem.
leeftijdscheck.hidden = false;

// Dezelfde stappen als in de tijdlijn, met de leeftijd in maanden
const stappen = [
  { naam: "Oriënteren", maanden: 30, woord: "rond" },
  { naam: "Kennismaken", maanden: 36, woord: "rond", belangrijk: true },
  { naam: "Aanmelden", maanden: 36, woord: "vanaf" },
  { naam: "Wennen", maanden: 46, woord: "in" },
  { naam: "Groep 1 en BSO", maanden: 48, woord: "in" },
];

// Telt een aantal maanden op bij een datum
function plusMaanden(datum, maanden) {
  return new Date(datum.getFullYear(), datum.getMonth() + maanden);
}

// Maakt van een datum een tekst als "maart 2027"
function alsMaand(datum) {
  return datum.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}

function toonUitkomst() {
  if (!checkMaand.value || !checkJaar.value) {
    uitkomst.innerHTML = "<p>Kies de maand en het jaar. Dan verschijnen hier de datums.</p>";
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

  // Per stap een regel. Is die maand al bereikt? Dan staat er "nu".
  const regels = stappen.map((stap) => {
    const datum = plusMaanden(geboorte, stap.maanden);
    const wanneer = datum <= dezeMaand ? "nu" : `${stap.woord} ${alsMaand(datum)}`;
    const klasse = stap.belangrijk ? ' class="is-belangrijk"' : "";
    return `<li${klasse}><strong>${stap.naam}</strong> <span>${wanneer}</span></li>`;
  });
  uitkomst.innerHTML = `<ol class="leeftijdscheck__lijst">${regels.join("")}</ol>`;
}

checkMaand.addEventListener("change", toonUitkomst);
checkJaar.addEventListener("change", toonUitkomst);
