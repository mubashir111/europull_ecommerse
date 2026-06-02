import os
import glob
import re

html_files = glob.glob('/Users/mubashirt/websites/europull_ecommerse/*.html')

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace footer
    content = re.sub(
        r'<p><i class="icon-pointer"></i> Industrial Area, Dubai, <br>\s*United Arab Emirates.</p>\s*<p><i class="icon-call-end"></i> \+971 50 123 4567</p>\s*<p><i class="icon-envelope"></i> info@onshoretechnical.com.sa</p>',
        r'<p><i class="icon-pointer"></i> EUROPULL HEBENTECHNIK UK LIMITED<br>\n              61 BRIDGE STREET, KINGTON, HR5 3DJ, <br>\n              United Kingdom.</p>\n            <p><i class="icon-globe"></i> WWW.EUROPULL.COM</p>\n            <p><i class="icon-envelope"></i> INFO@EUROPULL.COM</p>',
        content
    )
    
    # Replace contact specific
    content = re.sub(
        r'<li> <i class="icon-map-pin"></i> Industrial Area, Dubai,<br>\s*United Arab Emirates.</li>\s*<li> <i class="icon-call-end"></i> \+971 50 123 4567</li>\s*<li> <i class="icon-envelope"></i> <a href="mailto:info@onshoretechnical.com.sa"\s*target="_top">info@onshoretechnical.com.sa</a> </li>',
        r'<li> <i class="icon-map-pin"></i> EUROPULL HEBENTECHNIK UK LIMITED<br>\n                      61 BRIDGE STREET, KINGTON, HR5 3DJ, United Kingdom.</li>\n                    <li> <i class="icon-globe"></i> WWW.EUROPULL.COM</li>\n                    <li> <i class="icon-envelope"></i> <a href="mailto:INFO@EUROPULL.COM"\n                        target="_top">INFO@EUROPULL.COM</a> </li>',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Processed", file_path)
