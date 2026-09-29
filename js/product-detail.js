$(document).ready(function () {
    // 1. Get Product ID from URL
    var urlParams = new URLSearchParams(window.location.search);
    var productId = urlParams.get('id');

    // 2. Redirect to products page if no ID is present
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    // 3. Look up product data
    var product = (typeof productsData !== 'undefined' && productsData[productId]) ? productsData[productId] : null;

    if (product) {
        // --- Document Title & Headers ---
        document.title = product.name + " - Europull Lifting Equipment";
        $('.sub-bnr h4').text(product.name.toUpperCase());
        $('#product-detail-name').text(product.name);

        // --- Breadcrumb ---
        $('#pd-crumb-category').text(product.category);
        $('#pd-crumb-name').text(product.name);

        // --- Metadata ---
        var standard = product.standard || (product.specs && product.specs.Standard) || 'EN / CE';
        $('#product-detail-category').text(product.category);
        $('#product-detail-standard').text(standard);
        $('#pd-trust-standard').text('Certified to ' + standard);

        // --- Summary Lead Description ---
        $('#product-detail-desc').text(product.description);

        // --- Key Specs Strip (Standard is already shown in the meta line) ---
        var $keySpecs = $('#product-key-specs');
        $keySpecs.empty();
        if (product.specs) {
            Object.keys(product.specs).filter(function (k) {
                return k !== 'Standard';
            }).slice(0, 3).forEach(function (k) {
                $keySpecs.append($('<li>')
                    .append($('<span class="pd-keyspec-label">').text(k))
                    .append($('<span class="pd-keyspec-value">').text(product.specs[k])));
            });
        }
        $keySpecs.toggle($keySpecs.children().length > 0);

        // --- Main Images Slider (FlexSlider) ---
        var $slider = $('.images-slider');
        if ($slider.length > 0 && product.images && product.images.length > 0) {
            var sliderHtml = '<ul class="slides">';
            product.images.forEach(function (img) {
                sliderHtml += '<li data-thumb="' + img + '"> <img class="img-responsive" src="' + img + '" alt="' + product.name + '"> </li>';
            });
            sliderHtml += '</ul>';

            if ($slider.data('flexslider')) {
                $slider.flexslider('destroy');
            }

            $slider.html(sliderHtml);

            if ($.fn.flexslider) {
                $slider.flexslider({
                    animation: "fade",
                    controlNav: "thumbnails"
                });
            }
        }

        // --- 1. Quick Parameters Table (Euroweld-Style 3-Column Table) ---
        var $paramBody = $('#product-parameters-body');
        if ($paramBody.length > 0) {
            $paramBody.empty();
            var params = product.parameters || [];

            // Dynamic fallback if parameters not explicitly defined
            if (params.length === 0) {
                params = [
                    ["Standard / Compliance", product.standard || "EN / CE Standard", "Certified"],
                    ["Rated Capacity", (product.specs && product.specs.Capacity) ? product.specs.Capacity : "Standard Industrial", "Available"],
                    ["Build Quality", "Heavy-Duty Industrial Grade Components", "Standard"],
                    ["Braking / Locking", "Automatic Safety Mechanism", "Fail-Safe"],
                    ["Safety Factor", (product.specs && product.specs["Safety Factor"]) ? product.specs["Safety Factor"] : "4:1 Minimum", "Proof Tested"],
                    ["Application", "Industrial, Construction & Marine Rigging", "Heavy Duty"]
                ];
            }

            params.forEach(function (p) {
                var rowHtml = '<tr>' +
                    '<td class="spec-param">' + p[0] + '</td>' +
                    '<td class="spec-val">' + p[1] + '</td>' +
                    '<td class="spec-range"><span class="spec-chip">' + p[2] + '</span></td>' +
                    '</tr>';
                $paramBody.append(rowHtml);
            });
        }

        // --- 2. Tab 1: Full Capacity & Model Specifications Table (Toyolift / Europull PDF Style) ---
        var $techContainer = $('#product-tech-table-container');
        if ($techContainer.length > 0) {
            $techContainer.empty();
            if (product.techTable && product.techTable.headers && product.techTable.rows) {
                var tt = product.techTable;
                var tableHtml = '<div class="europull-tech-table-wrapper">';
                tableHtml += '<div class="europull-tech-table-title">';
                tableHtml += '<span><i class="fa fa-sliders" style="margin-right: 8px; color: #ffe115;"></i> ' + (tt.title || (product.name + ' Technical Specifications')) + '</span>';
                tableHtml += '<span class="badge-std">' + (tt.standard || product.standard || 'CERTIFIED') + '</span>';
                tableHtml += '</div>';

                tableHtml += '<div class="table-responsive">';
                tableHtml += '<table class="table europull-tech-table">';
                tableHtml += '<thead><tr>';
                tt.headers.forEach(function (h) {
                    tableHtml += '<th>' + h + '</th>';
                });
                tableHtml += '</tr></thead>';

                tableHtml += '<tbody>';
                tt.rows.forEach(function (r) {
                    tableHtml += '<tr>';
                    r.forEach(function (col, idx) {
                        if (idx === 0) {
                            tableHtml += '<td><strong class="model-badge">' + col + '</strong></td>';
                        } else {
                            tableHtml += '<td>' + col + '</td>';
                        }
                    });
                    tableHtml += '</tr>';
                });
                tableHtml += '</tbody></table></div></div>';

                $techContainer.html(tableHtml);
            } else {
                // Fallback specs list if table not available
                var fallbackHtml = '<div class="alert alert-info" style="border-radius: 4px;">Technical specifications table is being updated with the latest factory testing data. Contact our engineering team for specialized dimensions.</div>';
                if (product.specs) {
                    fallbackHtml += '<div class="table-responsive"><table class="table table-bordered">';
                    for (var sKey in product.specs) {
                        fallbackHtml += '<tr><th style="width: 30%; background: #f8fafc;">' + sKey + '</th><td>' + product.specs[sKey] + '</td></tr>';
                    }
                    fallbackHtml += '</table></div>';
                }
                $techContainer.html(fallbackHtml);
            }
        }

        // --- 3. Tab 2: Key Features & Engineering Advantages ---
        var $featuresContainer = $('#product-features-container');
        if ($featuresContainer.length > 0) {
            $featuresContainer.empty();
            var features = product.features || [
                ["Industrial Heavy-Duty Construction", "Manufactured from high-strength forged and machined alloy components built for continuous plant and field service."],
                ["Fail-Safe Braking / Positive Locking", "Engineered with integrated safety mechanisms to prevent accidental slips or dynamic load drop."],
                ["Corrosion Protection", "Industrial-grade surface treatments for resistance to extreme moisture, saltwater, and abrasive dust."],
                ["Proof Tested & Certified", "100% factory proof-load tested in strict adherence to international safety standards."]
            ];

            var featHtml = '<div class="europull-features-grid">';
            features.forEach(function (f) {
                featHtml += '<div class="europull-feature-card">';
                featHtml += '<h6><i class="fa fa-check"></i> ' + f[0] + '</h6>';
                featHtml += '<p>' + f[1] + '</p>';
                featHtml += '</div>';
            });
            featHtml += '</div>';
            $featuresContainer.html(featHtml);
        }

        // --- 4. Tab 3: Standards & Compliance ---
        var $standardsContainer = $('#product-standards-container');
        if ($standardsContainer.length > 0) {
            $standardsContainer.empty();
            var standards = product.standards || [
                ["International Safety Compliance", "Built to European and international machinery safety directives."],
                ["Factory Proof Tested", "Individually proof tested to 1.5x Working Load Limit (WLL)."],
                ["ISO 9001:2015 Quality", "Manufactured under audited quality management systems."],
                ["Full Material Traceability", "Delivered with traceable serial numbers and inspection certification."]
            ];

            var stdHtml = '<div class="europull-standards-grid">';
            standards.forEach(function (s) {
                stdHtml += '<div class="europull-standard-item">';
                stdHtml += '<div class="std-icon"><i class="fa fa-certificate"></i></div>';
                stdHtml += '<div>';
                stdHtml += '<h6>' + s[0] + '</h6>';
                stdHtml += '<p>' + s[1] + '</p>';
                stdHtml += '</div></div>';
            });
            stdHtml += '</div>';
            $standardsContainer.html(stdHtml);
        }

        // --- 5. Tab 4: Overview & Description ---
        var $descContainer = $('#product-description-container');
        if ($descContainer.length > 0) {
            var overviewText = product.overview || (product.description + " Engineered for maximum reliability, durability, and strict global compliance across industrial, construction, oilfield, and marine sectors.");
            var descHtml = '<div style="background: #ffffff; padding: 25px; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">';
            descHtml += '<h5 style="color: #2d3a4b; font-weight: 700; margin-top: 0; margin-bottom: 15px; font-size: 16px;">Product Overview &amp; Operational Excellence</h5>';
            descHtml += '<p style="font-size: 14px; line-height: 26px; color: #555; margin-bottom: 20px;">' + overviewText + '</p>';
            descHtml += '<div class="row" style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">';
            descHtml += '<div class="col-md-6"><h6 style="color: #2d3a4b; font-weight: 700; font-size: 13px; text-transform: uppercase;"><i class="fa fa-wrench" style="color: #ffe115; margin-right: 8px;"></i> Recommended Applications</h6><ul style="font-size: 13px; color: #666; line-height: 22px; padding-left: 20px;"><li>Offshore Oil &amp; Gas Platforms</li><li>Heavy Construction &amp; Structural Steel Erection</li><li>Marine Shipyards &amp; Vessel Maintenance</li><li>Manufacturing Plants &amp; Foundries</li></ul></div>';
            descHtml += '<div class="col-md-6"><h6 style="color: #2d3a4b; font-weight: 700; font-size: 13px; text-transform: uppercase;"><i class="fa fa-info-circle" style="color: #ffe115; margin-right: 8px;"></i> Inspection &amp; Maintenance</h6><ul style="font-size: 13px; color: #666; line-height: 22px; padding-left: 20px;"><li>Annual proof-load testing and visual examination</li><li>Lubricate load chain with acid-free machinery oil</li><li>Inspect hooks and latches for deformation or wear</li><li>Store in a clean, dry, protected environment</li></ul></div>';
            descHtml += '</div></div>';
            $descContainer.html(descHtml);
        }

        // --- 6. "Add to Quote" Button Data ---
        var $btn = $('.add-to-quote');
        $btn.attr('data-id', productId);
        $btn.attr('data-name', product.name);
        $btn.attr('data-image', product.images[0]);
        $btn.attr('data-url', 'product-detail_01.html?id=' + productId);

        // --- 7. Social Sharing & Open Graph ---
        var currentUrl = window.location.href;
        var origin = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "";
        var imageUrl = origin ? (origin + window.location.pathname.replace('product-detail_01.html', '') + product.images[0]) : product.images[0];

        $('meta[property="og:title"]').attr('content', product.name + " - Europull");
        $('meta[property="og:description"]').attr('content', product.description);
        $('meta[property="og:image"]').attr('content', imageUrl);
        $('meta[property="og:url"]').attr('content', currentUrl);

        $('.share-facebook').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(currentUrl));
        $('.share-whatsapp').attr('href', 'https://wa.me/?text=' + encodeURIComponent("Check out this " + product.name + ": " + currentUrl));
        $('.share-instagram').attr('href', 'https://www.instagram.com/');

    } else {
        // Handle "Product Not Found"
        $('.shop-detail').html('<div class="alert alert-danger" style="margin: 50px 0; padding: 25px;"><h4>Product Not Found</h4><p>We could not find the requested product. Please return to the <a href="products.html" style="font-weight: 700; text-decoration: underline;">Products Catalog</a>.</p></div>');
    }
});
