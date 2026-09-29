#!/usr/bin/env node
/*
 * Builds one static HTML page per product from js/products-data.js.
 *
 * Why: product-detail_01.html?id=... renders everything with JavaScript, so
 * search engines and link previews only ever see a generic "Product Details"
 * page. These static pages carry the full specification in the HTML with a
 * unique title, description and structured data per product.
 *
 * Run from the project root after editing js/products-data.js:
 *   node tools/build-product-pages.js
 *
 * Outputs:
 *   <slug>.html          one page per product (project root)
 *   js/product-urls.js   id -> page map, used by the product listing and by
 *                        product-detail_01.html to redirect old links
 *   sitemap.xml          product URLs refreshed between the PRODUCT PAGES markers
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://europull.com/';
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

// ---------- Load product data ----------
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(read('js/products-data.js') + '\nthis.productsData = productsData;', sandbox);
const products = sandbox.productsData;

// Friendlier file names where the data id is too generic.
const SLUG_OVERRIDES = {
  'chain': 'alloy-steel-lifting-chain',
  'jack': 'rack-jack',
  'pallet-truck': 'hand-pallet-truck',
};
const slugFor = (id) => (SLUG_OVERRIDES[id] || id) + '.html';

// ---------- Shared chrome from the existing product template ----------
const template = read('product-detail_01.html');
const HEADER = template.slice(template.indexOf('<body>'), template.indexOf('</header>') + '</header>'.length);
const FOOTER = template.slice(template.indexOf('<!--======= FOOTER =========-->'), template.indexOf('<!--======= RIGHTS =========-->'));

// ---------- Helpers ----------
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '…');
const modelPrefix = (p) => {
  const first = p.techTable && p.techTable.rows[0] && p.techTable.rows[0][0];
  const m = first && String(first).match(/^[A-Z]{2,}(?:-[A-Z]+)?/);
  return m ? m[0] : '';
};
const safetyFactor = (p) => {
  const m = p.techTable && p.techTable.standard && p.techTable.standard.match(/Safety Factor:\s*([\d.:]+)/i);
  return m ? m[1] : '';
};

function faqsFor(id, p) {
  const name = `Europull ${p.name}`;
  const t = p.techTable;
  const faqs = [];

  if (t && t.rows.length) {
    const codes = t.rows.map((r) => r[0]);
    const col = t.headers[1];
    const first = t.rows[0][1];
    const last = t.rows[t.rows.length - 1][1];
    faqs.push([
      `Which models of the ${name} are available?`,
      `The ${name} is available in ${codes.length} model${codes.length > 1 ? 's' : ''}: ${codes.join(', ')}. ` +
      (first !== last ? `${col} ranges from ${first} to ${last}.` : `${col}: ${first}.`) +
      ' Full figures for every model are in the technical specifications table on this page.',
    ]);
  }

  if (p.specs && p.specs.Capacity) {
    faqs.push([`What capacity range does the ${name} cover?`, `The ${name} covers ${p.specs.Capacity}.`]);
  }

  if (p.standard) {
    const sf = safetyFactor(p);
    faqs.push([
      `Which standard does the ${name} comply with?`,
      `The ${name} is manufactured to ${p.standard}.` + (sf ? ` It is designed with a ${sf} safety factor.` : ''),
    ]);
  }

  const skip = /standard|capacity|wll|application/i;
  (p.parameters || []).filter((r) => !skip.test(r[0])).slice(0, 3).forEach(([param, value]) => {
    faqs.push([`What ${lcFirst(param)} does the ${name} have?`, `The ${name}'s ${lcFirst(param)}: ${value}.`]);
  });

  faqs.push([
    `How do I request a quotation for the ${name}?`,
    `Click "Request a Quote" on this page to add the ${p.name} to your quote cart, or email info@europull.com with the model code and quantity you need.`,
  ]);
  return faqs;
}

function relatedFor(id, p) {
  const same = Object.keys(products).filter((k) => k !== id && products[k].category === p.category);
  const others = Object.keys(products).filter((k) => k !== id && products[k].category !== p.category);
  return same.concat(others).slice(0, 4);
}

// ---------- Page builder ----------
function build(id) {
  const p = products[id];
  const slug = slugFor(id);
  const url = SITE + slug;
  const img = p.images[0];
  const prefix = modelPrefix(p);
  const t = p.techTable;
  const capacity = p.specs && p.specs.Capacity;
  const sf = safetyFactor(p);
  const faqs = faqsFor(id, p);

  const titleBits = [`Europull ${p.name}${prefix ? ` (${prefix})` : ''}`];
  if (capacity) titleBits.push(capacity.replace(/\s*-\s*/, '–'));
  if (p.standard) titleBits.push(p.standard.split(' / ')[0]);
  const title = titleBits.join(' | ');
  const metaDesc = clip(`${p.description} ${t ? `${t.rows.length} models with full specifications.` : ''} Request a quote from Europull.`, 158);

  const keySpecs = Object.entries(p.specs || {}).filter(([k]) => k !== 'Standard').slice(0, 3)
    .map(([k, v]) => `                  <li><span class="pd-keyspec-label">${esc(k)}</span><span class="pd-keyspec-value">${esc(v)}</span></li>`).join('\n');

  const trust = [
    p.standard ? `<li><i class="fa fa-certificate"></i> Certified to ${esc(p.standard)}</li>` : '',
    t ? `<li><i class="fa fa-th-list"></i> ${t.rows.length} models available</li>` : '',
    sf ? `<li><i class="fa fa-shield"></i> Safety factor ${esc(sf)}</li>` : '',
  ].filter(Boolean).join('\n                  ');

  const techTable = t ? `
          <div class="europull-tech-table-wrapper">
            <div class="europull-tech-table-title">
              <span><i class="fa fa-sliders" style="margin-right: 8px; color: #ffe115;"></i> ${esc(t.title)}</span>
              <span class="badge-std">${esc(t.standard || p.standard || '')}</span>
            </div>
            <div class="table-responsive">
              <table class="table europull-tech-table">
                <thead>
                  <tr>
${t.headers.map((h) => `                    <th>${esc(h)}</th>`).join('\n')}
                  </tr>
                </thead>
                <tbody>
${t.rows.map((r) => `                  <tr>\n${r.map((c, i) => (i === 0 ? `                    <td><strong class="model-badge">${esc(c)}</strong></td>` : `                    <td>${esc(c)}</td>`)).join('\n')}\n                  </tr>`).join('\n')}
                </tbody>
              </table>
            </div>
          </div>` : '';

  const params = (p.parameters || []).map((r) => `                <tr>
                  <td class="spec-param">${esc(r[0])}</td>
                  <td class="spec-val">${esc(r[1])}</td>
                  <td class="spec-range"><span class="spec-chip">${esc(r[2])}</span></td>
                </tr>`).join('\n');

  const features = (p.features || []).map(([h, d]) => `            <div class="europull-feature-card">
              <h6><i class="fa fa-check"></i> ${esc(h)}</h6>
              <p>${esc(d)}</p>
            </div>`).join('\n');

  const standards = (p.standards || []).map(([h, d]) => `            <div class="europull-standard-item">
              <div class="std-icon"><i class="fa fa-certificate"></i></div>
              <div>
                <h6>${esc(h)}</h6>
                <p>${esc(d)}</p>
              </div>
            </div>`).join('\n');

  const faqHtml = faqs.map(([q, a], i) => `              <div class="panel panel-default">
                <div class="panel-heading">
                  <h4 class="panel-title">
                    <a${i ? ' class="collapsed"' : ''} data-toggle="collapse" data-parent="#pdFaq" href="#pdFaq${i + 1}">${esc(q)}</a>
                  </h4>
                </div>
                <div id="pdFaq${i + 1}" class="panel-collapse collapse${i ? '' : ' in'}">
                  <div class="panel-body">
                    <p>${esc(a)}</p>
                  </div>
                </div>
              </div>`).join('\n');

  const related = relatedFor(id, p).map((rid) => {
    const r = products[rid];
    return `            <div class="col-md-3 col-sm-6">
              <a href="${slugFor(rid)}" class="pd-related-card">
                <span class="pd-related-img"><img src="${esc(r.images[0])}" alt="Europull ${esc(r.name)}" loading="lazy"></span>
                <span class="pd-related-body">
                  <span class="pd-related-cat">${esc(r.category)}</span>
                  <strong>${esc(r.name)}</strong>
                  ${r.specs && r.specs.Capacity ? `<span class="pd-related-spec">${esc(r.specs.Capacity)}</span>` : ''}
                </span>
              </a>
            </div>`;
  }).join('\n');

  const jumpLinks = [
    t ? ['pd-specs', 'Specifications'] : null,
    params ? ['pd-parameters', 'Key Parameters'] : null,
    features ? ['pd-features', 'Features'] : null,
    standards ? ['pd-standards', 'Standards'] : null,
    p.overview ? ['pd-overview', 'Overview'] : null,
    ['pd-faq', 'FAQ'],
  ].filter(Boolean).map(([h, l]) => `<a href="#${h}">${l}</a>`).join('\n            ');

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: `Europull ${p.name}`,
        description: p.description,
        image: SITE + img,
        brand: { '@type': 'Brand', name: 'Europull' },
        category: p.category,
        url,
        ...(prefix ? { model: prefix } : {}),
        additionalProperty: Object.entries(p.specs || {}).map(([k, v]) => ({ '@type': 'PropertyValue', name: k, value: v })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + 'index.html' },
          { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + 'products.html' },
          { '@type': 'ListItem', position: 3, name: p.name, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  };

  const quoteAttrs = `data-id="${esc(id)}" data-name="${esc(p.name)}" data-image="${esc(img)}" data-url="${slug}"`;

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="83O0tPzErQK_wLkHAL2P2ZyA0dyfov4zYpjTD1YBax4">
  <!-- Generated by tools/build-product-pages.js from js/products-data.js. Edit the data, then rebuild. -->

  <title>${esc(title)}</title>
  <meta name="description" content="${esc(metaDesc)}">
  <meta name="author" content="Europull">
  <link rel="canonical" href="${url}">

  <meta property="og:type" content="product">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(metaDesc)}">
  <meta property="og:image" content="${SITE}${esc(img)}">

  <link rel="icon" type="image/png" sizes="192x192" href="images/favicon-192x192.png">
  <link rel="icon" type="image/png" sizes="96x96" href="images/favicon-96x96.png">
  <link rel="icon" type="image/png" sizes="48x48" href="images/favicon-48x48.png">
  <link rel="apple-touch-icon" sizes="180x180" href="images/apple-touch-icon.png">
  <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">

  <link href="css/bootstrap.min.css" rel="stylesheet">
  <link href="css/font-awesome.min.css" rel="stylesheet" type="text/css">
  <link href="css/ionicons.min.css" rel="stylesheet">
  <link href="css/main.css" rel="stylesheet">
  <link href="css/style.css" rel="stylesheet">
  <link href="css/responsive.css" rel="stylesheet">
  <script src="js/modernizr.js"></script>
  <link href='https://fonts.googleapis.com/css?family=Montserrat:400,600,700' rel='stylesheet' type='text/css'>
  <link href='https://fonts.googleapis.com/css?family=Playfair+Display:400,700,900' rel='stylesheet' type='text/css'>

  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>

  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-W4CT928J');</script>
  <!-- End Google Tag Manager -->
</head>

${HEADER}

    <div id="content">

      <!--======= PRODUCT SUMMARY =========-->
      <section class="pd-section">
        <div class="container">

          <ol class="breadcrumb pd-breadcrumb">
            <li><a href="index.html">Home</a></li>
            <li><a href="products.html">Products</a></li>
            <li><a href="products.html?s=${encodeURIComponent(p.category)}">${esc(p.category)}</a></li>
            <li class="active">${esc(p.name)}</li>
          </ol>

          <div class="shop-detail">
            <div class="row">
              <div class="col-md-5 col-sm-6">
                <div class="pd-gallery">
                  <div class="product-detail-image-box">
                    <a href="${esc(img)}" data-lighter><img class="img-responsive" src="${esc(img)}" alt="Europull ${esc(p.name)}"></a>
                  </div>
                </div>
              </div>

              <div class="col-md-7 col-sm-6">
                <h1 class="pd-title">Europull ${esc(p.name)}</h1>

                <p class="pd-meta">
                  Brand: <strong>Europull</strong>
                  <span class="pd-meta-sep">&middot;</span>
                  Category: <strong>${esc(p.category)}</strong>${p.standard ? `
                  <span class="pd-meta-sep">&middot;</span>
                  Standard: <strong>${esc(p.standard)}</strong>` : ''}${prefix ? `
                  <span class="pd-meta-sep">&middot;</span>
                  Series: <strong>${esc(prefix)}</strong>` : ''}
                </p>

                <p class="pd-desc">${esc(p.description)}</p>
${keySpecs ? `
                <ul class="pd-keyspecs">
${keySpecs}
                </ul>
` : ''}
                <div class="pd-cta">
                  <a href="javascript:void(0);" class="btn pd-btn-primary add-to-quote" ${quoteAttrs}><i class="fa fa-shopping-basket"></i> Request a Quote</a>
                  <a href="#pd-specs" class="btn pd-btn-secondary"><i class="fa fa-table"></i> View Specifications</a>
                </div>

                <p class="pd-contact"><i class="icon-envelope"></i> Need sizing help? Email
                  <a href="mailto:info@europull.com">info@europull.com</a>
                </p>

                <ul class="pd-trust">
                  ${trust}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section jump links -->
      <nav class="pd-jump" aria-label="Product sections">
        <div class="container">
          <div class="pd-jump-inner">
            ${jumpLinks}
          </div>
        </div>
      </nav>
${t ? `
      <!--======= TECHNICAL SPECIFICATIONS =========-->
      <section class="pd-block" id="pd-specs">
        <div class="container">
          <h2 class="pd-block-title">Technical Specifications</h2>
          <p class="pd-block-lead">Model-by-model data for the Europull ${esc(p.name)} range.</p>
${techTable}
          <p class="pd-block-note">Need a model or configuration not listed? <a href="mailto:info@europull.com">Email our engineering team</a> or download the <a href="pdf/europull.pdf" target="_blank">full catalog (PDF)</a>.</p>
        </div>
      </section>
` : ''}${params ? `
      <!--======= KEY PARAMETERS =========-->
      <section class="pd-block pd-block-alt" id="pd-parameters">
        <div class="container">
          <h2 class="pd-block-title">Key Parameters</h2>
          <div class="europull-quick-specs">
            <div class="table-responsive">
              <table class="table europull-spec-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Specification</th>
                    <th>Highlight</th>
                  </tr>
                </thead>
                <tbody>
${params}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
` : ''}${features ? `
      <!--======= FEATURES =========-->
      <section class="pd-block" id="pd-features">
        <div class="container">
          <h2 class="pd-block-title">Key Features &amp; Advantages</h2>
          <div class="europull-features-grid">
${features}
          </div>
        </div>
      </section>
` : ''}${standards ? `
      <!--======= STANDARDS =========-->
      <section class="pd-block pd-block-alt" id="pd-standards">
        <div class="container">
          <h2 class="pd-block-title">Standards &amp; Compliance</h2>
          <div class="europull-standards-grid">
${standards}
          </div>
        </div>
      </section>
` : ''}${p.overview ? `
      <!--======= OVERVIEW =========-->
      <section class="pd-block" id="pd-overview">
        <div class="container">
          <h2 class="pd-block-title">Product Overview</h2>
          <p class="pd-overview">${esc(p.overview)}</p>
        </div>
      </section>
` : ''}
      <!--======= FAQ =========-->
      <section class="pd-block pd-block-alt" id="pd-faq">
        <div class="container">
          <h2 class="pd-block-title">Frequently Asked Questions</h2>
          <div class="row">
            <div class="col-md-10">
              <div class="panel-group europull-theme-faq" id="pdFaq">
${faqHtml}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!--======= RELATED PRODUCTS =========-->
      <section class="pd-block" id="pd-related">
        <div class="container">
          <h2 class="pd-block-title">Related Products</h2>
          <div class="row pd-related-row">
${related}
          </div>
        </div>
      </section>

    </div>

    ${FOOTER}
  </div>
  <script src="js/jquery-1.11.3.min.js"></script>
  <script src="js/bootstrap.min.js"></script>
  <script src="js/own-menu.js"></script>
  <script src="js/jquery.lighter.js"></script>
  <script src="js/owl.carousel.min.js"></script>
  <script src="js/main.js"></script>
  <script src="js/cart.js"></script>
  <script src="js/search.js"></script>
</body>

</html>
`;
}

// ---------- Write pages ----------
const urls = {};
for (const id of Object.keys(products)) {
  write(slugFor(id), build(id));
  urls[id] = slugFor(id);
}

write('js/product-urls.js', `/* Generated by tools/build-product-pages.js. Do not edit by hand. */
var productUrls = ${JSON.stringify(urls, null, 4)};

function productUrl(id) {
    return productUrls[id] || ('product-detail_01.html?id=' + encodeURIComponent(id));
}
`);

// ---------- Sitemap ----------
const START = '  <!-- PRODUCT PAGES (generated by tools/build-product-pages.js) -->';
const END = '  <!-- /PRODUCT PAGES -->';
const today = new Date().toISOString().slice(0, 10);
let sitemap = read('sitemap.xml');
const block = [START, ...Object.values(urls).map((u) => `  <url>
    <loc>${SITE}${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`), END].join('\n');
if (sitemap.includes(START)) {
  sitemap = sitemap.slice(0, sitemap.indexOf(START)) + block + sitemap.slice(sitemap.indexOf(END) + END.length);
} else {
  sitemap = sitemap.replace('</urlset>', block + '\n</urlset>');
}
write('sitemap.xml', sitemap);

console.log(`Built ${Object.keys(urls).length} product pages.`);
