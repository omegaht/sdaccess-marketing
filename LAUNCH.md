# Launch checklist: www.sdaccess.com.pa

This site replaces the current `https://www.sdaccess.com.pa`. The steps below assume it goes
on the **same host** (LiteSpeed / cPanel), which reads the `.htaccess` file in this repo.
If you move to another host, see [Other hosts](#other-hosts).

## 1. Before you upload

- [ ] **Back up the current site.** In cPanel File Manager, download or zip everything in
      `public_html` (or wherever the site lives) and keep a copy.
- [ ] **Preview locally** and click through every page: `python3 -m http.server 8080`, then
      open http://localhost:8080.
- [ ] **Check the contact form.** The quote form (Contacto → "Cotice su proyecto") doesn't
      send anything itself: it opens the visitor's email app with a pre-filled message to
      `info@sdaccess.com.pa`. Send one test and confirm it arrives.
- [ ] **Decide on WhatsApp.** `WHATSAPP_NUMERO` in `js/v2.js` is empty, so the floating
      WhatsApp button is hidden and the form sends by email. Set it to the business number
      (digits only, with country code, e.g. `5076XXXXXXX`) to show the button and make the
      form send through WhatsApp instead.

## 2. Upload

1. In the site's web folder, **move the old site's files into a backup folder** (for example
   `_old-site/`) instead of uploading on top of them. The old site has files the new one
   doesn't use (`Instalaciones.html` with a capital I, `css/index.css`, `css/main.css`,
   `icon.png`, `site.webmanifest`), and leaving them in place makes them reachable.
2. **Upload everything from this repo except** `.git/`, `README.md`, `LAUNCH.md` and
   `.gitignore`. In particular, upload:
   - `index.html`, `productos.html`, `instalaciones.html`, `nosotros.html`, `contacto.html`
   - `css/`, `js/`, `img/`
   - `robots.txt`, `sitemap.xml`
   - **`.htaccess`**: it's a hidden file. In cPanel File Manager, turn on
     *Settings → Show Hidden Files* to confirm it was uploaded.

## 3. Check it's live (run right after uploading)

```sh
# Pages load (expect 200 for each)
for p in "" productos.html instalaciones.html nosotros.html contacto.html robots.txt sitemap.xml; do
  printf "%-22s" "/$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://www.sdaccess.com.pa/$p"
done

# Redirects (expect 301 and the Location shown)
curl -sI http://www.sdaccess.com.pa/                      | grep -iE "^HTTP|^location"   # -> https://www.sdaccess.com.pa/
curl -sI https://sdaccess.com.pa/                         | grep -iE "^HTTP|^location"   # -> https://www.sdaccess.com.pa/
curl -sI https://www.sdaccess.com.pa/Instalaciones.html   | grep -iE "^HTTP|^location"   # -> /instalaciones.html
curl -sI https://www.sdaccess.com.pa/index.html           | grep -iE "^HTTP|^location"   # -> /

# Compression and caching (expect content-encoding and a cache/expires header)
curl -sI -H "Accept-Encoding: gzip" https://www.sdaccess.com.pa/css/editorial.css | grep -iE "content-encoding|cache-control|expires"
```

If the redirects return 200 instead of 301, the host isn't reading `.htaccess`. Check that it
was uploaded and ask the host whether `mod_rewrite` is enabled.

Also check by hand:

- [ ] Every page on a phone and on desktop: menu, galleries, project panels on
      Instalaciones, the videos (Curaçao and Palmerola, third slide).
- [ ] The contact form opens an email (or WhatsApp) with the quote details from the live site.

## 4. Search engines (same day)

- [ ] **Google Search Console** (https://search.google.com/search-console): add the property
      `https://www.sdaccess.com.pa` (or a Domain property for `sdaccess.com.pa`), verify it,
      then go to *Sitemaps* and submit `sitemap.xml`.
- [ ] In Search Console, use *URL Inspection* on the home page and *Request indexing*.
- [ ] **Bing Webmaster Tools** (https://www.bing.com/webmasters): you can import the site
      straight from Search Console.
- [ ] **Structured data**: run the home page through https://search.google.com/test/rich-results
      and confirm it detects a `LocalBusiness` with no errors.

## 5. Business listings and social

- [ ] **Google Business Profile**: make sure the name, address (Edificio 37E, piso 8,
      oficina 806, Santa María Business District), phone (+507 396 6976) and website match the
      site exactly.
- [ ] **Social previews**: paste the home URL into
      - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/ (click *Scrape Again*)
      - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

      Both should show the Altaplaza night photo, the title and the description. This also
      clears any cached preview from the old site.
- [ ] Update the website link on Instagram and LinkedIn if needed.

## 6. First weeks

- [ ] Search Console → *Pages*: watch for 404s or "Duplicate without user-selected canonical"
      in the first 1–2 weeks. The old `Instalaciones.html` should show as a redirect, not an error.
- [ ] Search Console → *Performance*: compare clicks and impressions against the old site.

## Rollback

Move the new files out, move the contents of `_old-site/` back, and delete the new
`.htaccess` (the old site didn't have these redirects).

## Other hosts

If the site goes on Netlify, Cloudflare Pages or similar instead, `.htaccess` is ignored.
Create a `_redirects` file with the same rules:

```
http://sdaccess.com.pa/*      https://www.sdaccess.com.pa/:splat  301!
https://sdaccess.com.pa/*     https://www.sdaccess.com.pa/:splat  301!
/Instalaciones.html           /instalaciones.html                 301
```

These hosts already compress files and handle http → https. Point the domain's DNS at the new
host and keep the old host running until DNS has switched over.

## Known open items (not launch blockers)

- Lighthouse flags low color contrast somewhere on Inicio and Nosotros (accessibility 95–96).
- The intro loader on Inicio and the scroll-reveal on Instalaciones' project cards delay when
  the main image appears (about 3 s on mobile in Lighthouse).
- The support portal isn't part of this site. If it needs to stay online, host it separately
  (for example `soporte.sdaccess.com.pa`) and link to it from here if wanted.
