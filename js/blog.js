document.addEventListener('DOMContentLoaded', function() {
    const isBlogDetail = document.getElementById('blog-detail-container') !== null;
    const isBlogList = document.getElementById('blog-container') !== null;

    if (isBlogList) {
        fetchBlogs();
    }

    if (isBlogDetail) {
        fetchBlogDetail();
    }
});

function fetchBlogs() {
    fetch('https://onshore.tbo365.cloud/api/method/onshore.api.get_blogs?website=EUROPULL', {
        headers: { 'Authorization': 'token9897e6ee3838b6c:06d7193075244d6' }
    })
    .then(response => response.json())
    .then(data => {
        if(data.message && data.message.success && data.message.blogs) {
            renderBlogs(data.message.blogs);
        } else {
            renderBlogs([]);
        }
    })
    .catch(error => {
        console.error('Error fetching blogs:', error);
        renderBlogs([]);
    });
}

function fetchBlogDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const route = urlParams.get('route');

    if (!route) {
        document.getElementById('blog-detail-container').innerHTML = '<div class="text-center" style="padding: 50px;"><h3>Blog post not found.</h3><a href="blog.html" class="btn btn-dark">Back to Blog</a></div>';
        return;
    }

    fetch('https://onshore.tbo365.cloud/api/method/onshore.api.get_blog_detail?route=' + encodeURIComponent(route), {
        headers: { 'Authorization': 'token9897e6ee3838b6c:06d7193075244d6' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.success && data.message.blog) {
            renderBlogDetail(data.message.blog);
        } else {
            document.getElementById('blog-detail-container').innerHTML = '<div class="text-center" style="padding: 50px;"><h3>Blog post not found.</h3><a href="blog.html" class="btn btn-dark">Back to Blog</a></div>';
        }
    })
    .catch(error => {
        console.error('Error fetching blog detail:', error);
        document.getElementById('blog-detail-container').innerHTML = '<div class="text-center" style="padding: 50px;"><h3>Error loading blog post.</h3><a href="blog.html" class="btn btn-dark">Back to Blog</a></div>';
    });
}

function formatDate(dateString) {
    if(!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function renderBlogs(blogs) {
    const container = document.getElementById('blog-container');
    if(!container) return;
    
    if(blogs.length === 0) {
        container.innerHTML = '<div class="col-xs-12 text-center"><p>No blog posts found.</p></div>';
        return;
    }

    let html = '';
    blogs.forEach(b => {
        const img = b.meta_image ? `https://onshore.tbo365.cloud${b.meta_image}` : 'images/blog-default.jpg';
        const intro = b.blog_intro ? b.blog_intro.substring(0, 120) + '...' : '';
        
        // Using Europull's typical grid structure for a product/post (e.g. col-md-4)
        html += `
            <div class="col-md-4 col-sm-6 mb-4" style="margin-bottom: 30px;">
                <div class="blog-item" style="border: 1px solid #eee; padding-bottom: 15px; border-radius: 5px; overflow: hidden;">
                    <a href="blog-detail.html?route=${b.route}">
                        <img src="${img}" alt="${b.title}" class="img-responsive" style="height:220px; width:100%; object-fit:cover;">
                    </a>
                    <div class="blog-content" style="padding: 15px;">
                        <span class="text-muted" style="font-size: 12px;">${formatDate(b.published_on)} | ${b.blog_category || 'General'}</span>
                        <h5 style="margin-top: 10px; font-weight: bold;">
                            <a href="blog-detail.html?route=${b.route}" style="color: #333;">${b.title}</a>
                        </h5>
                        <p style="font-size: 14px; color: #666;">${intro}</p>
                        <a href="blog-detail.html?route=${b.route}" class="btn btn-dark btn-sm" style="margin-top: 10px; background-color: #f7a933; color: white; border: none; padding: 5px 15px;">Read More</a>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderBlogDetail(blog) {
    const container = document.getElementById('blog-detail-container');
    if (!container) return;

    const img = blog.meta_image ? `https://onshore.tbo365.cloud${blog.meta_image}` : 'images/blog-default.jpg';
    
    // Update page title
    document.title = blog.title + ' | Europull Blog';
    
    // Update sub banner title if it exists
    const bannerTitle = document.querySelector('.sub-bnr h4');
    if(bannerTitle) bannerTitle.textContent = blog.title;
    
    let html = `
        <div class="blog-single">
            <img src="${img}" alt="${blog.title}" class="img-responsive" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 5px; margin-bottom: 20px;">
            <p class="text-muted" style="font-size: 14px;">${formatDate(blog.published_on)} | <strong>${blog.blog_category || 'General'}</strong></p>
            <h2 style="margin-top: 10px; margin-bottom: 20px; font-weight: bold;">${blog.title}</h2>
            
            <div class="blog-body" style="font-size: 16px; line-height: 1.8; color: #444;">
                ${blog.content}
            </div>

            <hr style="margin: 40px 0;" />
            <a href="blog.html" class="btn btn-dark" style="background-color: #f7a933; color: white; border: none;">Back to Blog</a>
        </div>
    `;
    
    container.innerHTML = html;
}
