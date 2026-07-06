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
        { name: "Network", url: "network.html" },
        { name: "Proxmox", url: "proxmox.html" },
        { name: "ADS-B", url: "adsb.html" },
        { name: "Photography", url: "photography.html" },
        { name: "Status Page", url: "https://status.twobip.com" },
        { name: "Cool Links", url: "links.html" }
    ];

    const newsItems = [
        {
            title: "June wigle stats",
            date: "July 6, 2026 at 6:23 PM",
            content: "I updated the wigle stats for june i almost got more than may but i forgot to do it at maccas so i didnt"
        },
        {
            title: "Network page",
            date: "June 25, 2026 at 11:42 PM",
            content: "I added a whole page for the network instead of just a tiny section on my stuff and i also increased the front page news items to 3"
        },
        {
            title: "May wigle stats",
            date: "June 7, 2026 at 3:55 PM",
            content: "I updated the wigle stats for may not really a good month only 15k but this month seems like its going to be lower"
        },
        {
            title: "Photography page",
            date: "June 7, 2026 at 3:34 PM",
            content: "I added the photography page so now you can look at all the rats and pigeons in my garden"
        },
        {
            title: "No more marquees",
            date: "May 27, 2026 at 12:33 PM",
            content: "The marquees now use css keyframes and are hardware accelerated because it was lagging on my ipad <br> UPDATE: it works good on my ipad now"
        },
        {
            title: "I added the adsb page",
            date: "May 22, 2026 at 10:45 AM",
            content: "I added the adsb page so you can see the planes and things now"
        },
        {
            title: "I updated the wigle stats",
            date: "May 21, 2026 at 11:43 PM",
            content: "I updated the wigle stats as of 21 may 2026 i havent done mays yet because the month isnt finished but i will next month"
        },
        {
            title: "Tatty Analytics",
            date: "May 21, 2026 at 11:41 PM",
            content: "I accidentally had cloudflare analytics on so it was injecting things into the website but i have turned it off now :D"
        },
        {
            title: "Drastic website changes",
            date: "May 21, 2026 at 11:40 PM",
            content: "I changed a few words of some of the things i would list them here but it was like 30 mins ago and i forgot them"
        },
        {
            title: "I made the website",
            date: "May 21, 2026 at 11:39 PM",
            content: "I have made this website today hopefully there is nothing wrong with it"
        }
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

    function generateNews() {
        const homeContainer = document.getElementById('news-container-home');
        const fullContainer = document.getElementById('news-container-full');

        const createNewsHtml = (items) => {
            return items.map(item => `
                <div class="news-item">
                    <div class="news-header">${item.title}</div>
                    <div class="news-date">Posted on: ${item.date}</div>
                    <p>${item.content}</p>
                </div>
            `).join('');
        };

        if (homeContainer) {
            homeContainer.innerHTML = createNewsHtml(newsItems.slice(0, 3));
        }

        if (fullContainer) {
            fullContainer.innerHTML = createNewsHtml(newsItems);
        }
    }

    function randomize() {
        const marqueeElement = document.getElementById('marquee-text');
        const lastUpdatedElement = document.getElementById('last-updated');

        if (marqueeElement) {
            const randomMarquee = marqueeMessages[Math.floor(Math.random() * marqueeMessages.length)];
            marqueeElement.textContent = randomMarquee;
            
            // Fixed speed logic
            // We wait a tiny bit to ensure the text has rendered so we can get accurate width
            setTimeout(() => {
                const textWidth = marqueeElement.offsetWidth;
                const containerWidth = marqueeElement.parentElement.offsetWidth;
                const speed = 100; // pixels per second (adjust this for faster/slower)
                const duration = textWidth / speed;
                marqueeElement.style.animationDuration = duration + 's';
            }, 50);
        }

        if (lastUpdatedElement) {
            const randomDate = updateDates[Math.floor(Math.random() * updateDates.length)];
            lastUpdatedElement.textContent = randomDate;
        }
    }

    function init() {
        generateSidebar();
        generateNews();
        randomize();
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
