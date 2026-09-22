$(document).ready(function () {
    var container = $('#dynamic-products-container');
    if (container.length === 0 || typeof productsData === 'undefined') return;

    // Defined order for categories
    var categoryOrder = [
        "Hoists",
        "Trolleys",
        "Winches",
        "Lifting Slings",
        "Clamps",
        "Material Handling",
        "Accessories"
    ];

    function renderProducts(filterText) {
        container.empty();
        filterText = filterText ? filterText.toLowerCase().trim() : "";

        // Filter and Group products by category
        var categorized = {};
        var hasResults = false;

        for (var key in productsData) {
            if (productsData.hasOwnProperty(key)) {
                var product = productsData[key];

                // Filtering Logic
                if (filterText) {
                    var matchName = product.name.toLowerCase().includes(filterText);
                    var matchDesc = product.description && product.description.toLowerCase().includes(filterText);
                    var matchCat = product.category && product.category.toLowerCase().includes(filterText);

                    if (!matchName && !matchDesc && !matchCat) {
                        continue; // Skip if no match
                    }
                }

                var cat = product.category || 'Other';
                if (!categorized[cat]) categorized[cat] = [];
                categorized[cat].push($.extend({ id: key }, product));
                hasResults = true;
            }
        }

        if (!hasResults) {
            container.html('<div class="container margin-top-50 text-center"><h4>No products found matching "' + filterText + '"</h4><p>Try checking your spelling or using different keywords.</p></div>');
            return;
        }

        // Render sections based on defined order (and any others at the end)
        var categoriesToRender = categoryOrder.concat(Object.keys(categorized).filter(function (c) {
            return categoryOrder.indexOf(c) < 0;
        }));

        categoriesToRender.forEach(function (cat) {
            if (!categorized[cat]) return;

            var products = categorized[cat];
            var section = $('<section class="shop-page padding-top-50 padding-bottom-50"></section>');
            var containerDiv = $('<div class="container"></div>');

            // Section Heading
            containerDiv.append('<div class="heading text-left"><h4>' + cat + '</h4><hr></div>');

            var row = $('<div class="papular-block row"></div>');

            products.forEach(function (p) {
                var img = p.images && p.images.length > 0 ? p.images[0] : 'images/no-image.jpg'; // Fallback

                var itemHtml = `
                <div class="col-md-3 col-sm-6">
                    <div class="item">
                        <div class="item-img"> 
                            <img class="img-1" src="${img}" alt="${p.name}"> 
                            <img class="img-2" src="${img}" alt="${p.name}">
                            <div class="overlay">
                                <div class="position-center-center">
                                    <div class="inn">
                                        <a href="${img}" data-lighter><i class="icon-magnifier"></i></a>
                                        <a href="product-detail_01.html?id=${p.id}"><i class="icon-link"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="item-name"> 
                            <a href="product-detail_01.html?id=${p.id}">${p.name}</a>
                            <p>${p.description ? p.description.substring(0, 50) + '...' : ''}</p>
                        </div>
                        <span class="price">
                            <a href="#" class="btn btn-small btn-round add-to-quote" 
                               data-id="${p.id}" 
                               data-name="${p.name}" 
                               data-image="${img}" 
                               data-url="product-detail_01.html?id=${p.id}">
                               Add to Quote
                            </a>
                        </span>
                    </div>
                </div>`;
                row.append(itemHtml);
            });

            containerDiv.append(row);

            if (cat === 'Winches') {
                var winchBanner = `
                <div class="margin-top-30 margin-bottom-10">
                    <div style="background: linear-gradient(135deg, #2d3a4b 0%, #1c2631 100%); border-radius: 6px; padding: 22px 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; border-left: 4px solid #ffe115; box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
                        <div>
                            <h5 style="color: #ffffff; margin: 0 0 6px 0; font-weight: 700; font-size: 16px; letter-spacing: 0.5px;">Heavy-Duty Industrial Winches (Hydraulic, Electric &amp; Manual)</h5>
                            <p style="margin: 0; color: #cbd5e1; font-size: 13px; line-height: 20px;">Explore the full Europull Hebentechnik winch portfolio, certified models (HWV, HWE, EWB series), and technical engineering specs.</p>
                        </div>
                        <a href="heavy-duty-europull-winches-in-saudi-arabia.html" class="btn btn-small" style="background: #ffe115; color: #2d3a4b; font-weight: 700; border-radius: 4px; padding: 10px 22px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; border: none; white-space: nowrap;">
                            View Heavy-Duty Winches &rarr;
                        </a>
                    </div>
                </div>`;
                containerDiv.append(winchBanner);
            }

            section.append(containerDiv);
            container.append(section);
        });
    }

    // Initial Render
    // Check URL param 's' for initial search
    var urlParams = new URLSearchParams(window.location.search);
    var initialSearch = urlParams.get('s') || "";
    if (initialSearch) {
        $('#product-search-input').val(initialSearch);
    }
    renderProducts(initialSearch);

    // Event Listener for Search Input
    $('#product-search-input').on('keyup', function () {
        var query = $(this).val();
        renderProducts(query);
    });
});
