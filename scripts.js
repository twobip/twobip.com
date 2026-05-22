(function() {
    const marqueeMessages = [
        "twobip.com",
        "twobip.com the best website in the whole world",
        "twobip.com is hosted on a hp z440 running proxmox",
        "twobip.com has a guarantee of 9% uptime",
        "twobip.com is the most technologically advanced website ever created",
        "twobip.com is 100% elephant free",
        "twobip.com probably exists",
    ];

    const updateDates = [
        "May 21, 1998",
        "Yesterday",
        "January 1, 1970",
        "5 seconds ago",
        "17.792 seconds ago",
        "100 hours ago",
        "National Spongebob Day",
        "Tomorrow",
        "never",
        "100 MILLION GAZILLION YEARS AGO",
        "17",
        "Just now",
        "In the future",
        "Once upon a time"
    ];

    const navLinks = [
        { name: "Home", url: "index.html" },
        { name: "News", url: "news.html" },
        { name: "My stuff", url: "mystuff.html" },
        { name: "Wardriving", url: "wardriving.html" },
        { name: "Proxmox", url: "proxmox.html" },
        { name: "ADS-B", url: "adsb.html" },
        { name: "Status Page", url: "https://status.twobip.com" },
        { name: "Cool Links", url: "links.html" }
    ];

    function generateSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;

        let html = `<h3>Navigation</h3><ul class="nav-links">`;
        navLinks.forEach(link => {
            html += `<li><a href="${link.url}">${link.name}</a></li>`;
        });
        html += `</ul><hr><div style="text-align: center;">
            <img src="images/construction.gif" alt="Under Construction" style="width: 100px;">
            <p><small>Site last updated:<br><span id="last-updated">now</span></small></p>
        </div>`;

        sidebarContainer.innerHTML = html;
    }

    function randomize() {
        const marqueeElement = document.getElementById('marquee-text');
        const lastUpdatedElement = document.getElementById('last-updated');

        if (marqueeElement) {
            const randomMarquee = marqueeMessages[Math.floor(Math.random() * marqueeMessages.length)];
            marqueeElement.textContent = randomMarquee;
        }

        if (lastUpdatedElement) {
            const randomDate = updateDates[Math.floor(Math.random() * updateDates.length)];
            lastUpdatedElement.textContent = randomDate;
        }
    }

    function init() {
        generateSidebar();
        randomize();
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
