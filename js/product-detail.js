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
    var product = productsData[productId];

    if (product) {
        // 4. Update the Page Content

        // Title & Breadcrumb
        $('.sub-bnr h4').text(product.name.toUpperCase());
        $('.shop-detail h4').text(product.name);

        // Images (Main Slider)
        // FlexSlider specific:
        var $slider = $('.images-slider');
        var sliderHtml = '<ul class="slides">';
        product.images.forEach(function (img) {
            sliderHtml += '<li data-thumb="' + img + '"> <img class="img-responsive" src="' + img + '" alt=""> </li>';
        });
        sliderHtml += '</ul>';

        // Destroy existing flexslider instance if initialized to allow clean re-init
        if ($slider.data('flexslider')) {
            $slider.flexslider('destroy');
        }

        $slider.html(sliderHtml);

        // Re-initialize FlexSlider
        // We use a slight timeout to ensure DOM is ready if needed, but synchronous usually works here
        $slider.flexslider({
            animation: "fade",
            controlNav: "thumbnails"
        });


        // Metadata
        $('.item-owner li:first-child span').text(' Europull'); // Brand
        $('.item-owner li:nth-child(2) span').text(' ' + product.category); // Category

        // Description
        $('.shop-detail p').first().text(product.description); // Short desc

        // Specs (Tab Content)
        var specsHtml = '<h6>TECHNICAL SPECIFICATIONS</h6><ul>';
        for (var key in product.specs) {
            specsHtml += '<li><p><strong>' + key + ':</strong> ' + product.specs[key] + '</p></li>';
        }
        specsHtml += '</ul>';
        $('#descr').html('<p>' + product.description + '</p>' + specsHtml);

        // "Add to Quote" Button Data
        var $btn = $('.add-to-quote');
        $btn.attr('data-id', productId); // Use .attr() for data attributes to ensure DOM updates for CSS/selectors if needed, though .data() updates memory. 
        // Best practice: update both if you rely on attribute selectors, but .data() is usually enough for jQuery. 
        // However, the previous verification showed it didn't update. Let's force attribute update.
        $btn.attr('data-id', productId);
        $btn.attr('data-name', product.name);
        $btn.attr('data-image', product.images[0]);
        $btn.attr('data-url', 'product-detail_01.html?id=' + productId);

        // Update document title
        document.title = product.name + " - Europull";

        // --- Social Sharing & Open Graph ---
        var currentUrl = window.location.href;
        var imageUrl = window.location.origin + window.location.pathname.replace('product-detail_01.html', '') + product.images[0];

        // Update Meta Tags
        $('meta[property="og:title"]').attr('content', product.name + " - Europull");
        $('meta[property="og:description"]').attr('content', product.description);
        $('meta[property="og:image"]').attr('content', imageUrl);
        $('meta[property="og:url"]').attr('content', currentUrl);

        // Update Share Links
        // Facebook
        $('.share-facebook').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(currentUrl));

        // WhatsApp
        $('.share-whatsapp').attr('href', 'https://wa.me/?text=' + encodeURIComponent("Check out this " + product.name + ": " + currentUrl));

        // Instagram (Note: Instagram does not support direct link sharing via web URL, linking to profile or homepage as fallback)
        $('.share-instagram').attr('href', 'https://www.instagram.com/');

    } else {
        // Handle "Product Not Found"
        $('.shop-detail').html('<div class="alert alert-danger">Product not found.</div>');
    }
});
