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

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', randomize);
    } else {
        randomize();
    }
})();
