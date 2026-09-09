# Amici del Cinema del Gambarogno — sito statico (Astro)

Sito statico riscritto in [Astro](https://astro.build) (output `static`).
Le 21 pagine dell'originale HTML sono identiche negli stessi URL, e il
contenuto di ogni pagina è ora un file **Markdown** — pronto per la futura
modifica da parte del cliente.

## Struttura

```
astro.config.mjs        configurazione (output statico)
src/
  layouts/Base.astro    layout unico: head, header, subnav, footer
  pages/                le pagine, in Markdown (*.md)
    index.md            Su di noi (home)
    about/              Informazioni legali
    contatti/
    galleria-fotografica/
    rassegna-estiva/    rassegna + prezzi + edizioni estate-2017…estate-2026
    rassegna-invernale/ rassegna + prezzi + edizioni inverno-2018…2020
public/                 asset (css, js, foto, locandine, robots.txt)
scripts/
  verify-identity.mjs   verifica che l'output sia identico alle fonti
dist/                   sito finale generato (pubblicabile)
```

## Comandi

```bash
npm install        # installa le dipendenze
npm run dev        # sviluppo su http://localhost:4321 (hot reload)
npm run build      # genera il sito finale in dist/
npm run preview    # anteprima locale della build
npm run verify     # verifica identità dell'output rispetto alle fonti
```

## Pubblicazione

Pubblica il contenuto di `dist/` sul tuo hosting (cartelle e file già
relativi: funziona da qualsiasi sottopath, senza configurazioni).

## Modifica dei contenuti

- **Il testo visibile** di ogni pagina sta nel corpo del file `.md`
  corrispondente (es. `src/pages/rassegna-estiva/prezzi/index.md`).
  Il corpo è HTML normale dentro il markdown: si può scrivere in HTML
  (classi del foglio di stile `public/css/style.css`, tabelle, immagini…)
  o in markdown semplice.
- **Frontmatter** (tra le `---` in cima al file):
  - `layout: ../layouts/Base.astro` (non rimuovere)
  - `title` / `description` → pagina e meta tag
  - `activeNav` → voce del menu evidenziata: `su-di-noi`, `estiva`,
    `invernale`, `contatti`, `galleria`
  - `section` → `estiva` o `invernale`: mostra la sotto-barra delle edizioni
  - `subnavActive` → edizione/prezzi evidenziato nella sotto-barra
    (es. `estate-2024`, `prezzi`)
- **Nuove pagine**: creare la cartella + `index.md` in `src/pages/`,
  es. `src/pages/rassegna-estiva/estate-2027/index.md`; il link nella
  sotto-barra va aggiunto in `src/layouts/Base.astro`.
- Le locandine vanno in `public/locandine/{estate,inverno}/YYYY.jpg`.

## Note tecniche

- Astro in modalità statica: nessuna dipendenza runtime.
- Link relativi → nessun vincolo sul dominio/prefisso al momento della
  pubblicazione.
- `public/` è copiato byte-identico in `dist/` (inclusi i file zero-byte
  in `public/assets/` e i file con spazi nei nomi: l'originale li aveva,
  così si conserva).
- Il link `favicon.svg` della pagina "Informazioni legali" dà 404:
  anche nell'originale la favicon non esisteva; conservato per fedeltà.
