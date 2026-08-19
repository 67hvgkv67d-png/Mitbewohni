# Mitbewohni – WG-Finder

Eine barrierearme Plattform für Menschen, die eine Mitbewohnerin oder einen Mitbewohner suchen.

Die Texte sind in Leichter Sprache. Die Seite funktioniert auf dem Handy und am Computer.

## Funktionen

- Steckbriefe ansehen und filtern
- eigenen Steckbrief mit Foto erstellen
- Steckbrief auf einer A4-Seite drucken oder als PDF speichern
- Favoriten, ausgeblendete Steckbriefe und persönliche Notizen im Browser speichern
- Vorlese-Funktion
- Angaben zur Barrierefreiheit

## Lokal starten

Benötigt wird Node.js ab Version 22.13.

```bash
pnpm install
pnpm dev
```

Die fertige Version wird so geprüft:

```bash
pnpm test
```

## Daten

Veröffentlichte Steckbriefe werden in Cloudflare D1 gespeichert. Bilder werden in Cloudflare R2 gespeichert. Favoriten, ausgeblendete Steckbriefe und Notizen bleiben nur im jeweiligen Browser.

## Datenschutz

Die Plattform ist ein funktionsfähiger Entwurf. Vor dem Einsatz mit echten persönlichen Daten müssen Datenschutz, Einwilligung, Löschfristen und Zuständigkeiten geprüft und festgelegt werden.

## Vorschau

[wg-finder-steckbriefe.mahu350.chatgpt.site](https://wg-finder-steckbriefe.mahu350.chatgpt.site/)
