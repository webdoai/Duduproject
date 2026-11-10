# DUDU FOOD website

Plain HTML, CSS and vanilla JavaScript. No build step, no dependencies.

## Deploy on Netlify
1. Go to https://app.netlify.com/drop
2. Drag the unzipped `dudu-food` folder (or the zip's contents) onto the page.
3. Netlify gives you a live link. You can add a custom domain later.

## Before going live: edit `js/config.js`
- `whatsappNumber`: country code + number, digits only (e.g. `91XXXXXXXXXX`). Orders cannot be sent until this is set.
- `phoneDisplay`, `hours`, `social`, `mapsUrl`: fill in once verified. Empty fields show "coming soon" or are hidden.
- `menu`: set each dish's `price` (number) and `image`. Add dishes by copying a block. Prices left as `null` show "Price TBA".
- Check the category of Hakka Manchurian (`veg` or `nonveg`).

## Photos and logo
- The site uses illustrations until you add real photos. Put photos in `assets/images/` (WebP, about 1200px wide) and set the paths in `config.js` (`image`, `gallery[].src`, `heroImage`).
- Replace `assets/logo/logo.svg` with the real DUDU FOOD logo (keep the file name, or update `index.html`). A logo with a transparent or dark background works best on the charcoal header.
- To get a rich preview when the link is shared, add `<meta property="og:image" content="https://YOUR-DOMAIN/assets/images/og.jpg">` to `index.html`.

## Notes
- Orders open WhatsApp with a prepared message. They are not confirmed until the restaurant replies. There is no online payment.
- Customer details are never stored. The cart is saved only in the customer's own browser.
- Once you have a domain, add its URL to the structured data in `index.html` (`url`, `telephone`, `openingHours`) using verified details only.
