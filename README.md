# europull_ecommerse

## Product pages

Each product has its own static page (for example `beam-clamp.html`), generated from `js/products-data.js`.
After changing any product data, rebuild the pages:

```
node tools/build-product-pages.js
```

This rewrites the product pages, `js/product-urls.js` and the product entries in `sitemap.xml`.
Don't edit the generated product pages by hand; changes will be lost on the next build.
Old links (`product-detail_01.html?id=...`) redirect to the static pages.
