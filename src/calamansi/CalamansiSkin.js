class CalamansiSkin
{
    constructor(calamansi, path) {
        this.calamansi = calamansi;
        this.path = path;

        this.el = calamansi.el;
    }

    async init() {
        // Load and apply the skin
        await this.load();

        // Activate the player's controls
        this.activateControls();

        // Register event listeners
        this.addEventListeners();
    }

    async load() {
        this.loadCss(this.path);
        const skin = await this.fetchHtml(this.path);
        const content = this.el.innerHTML;

        // Prepare the DOM for the player instance using the skin's HTML
        let wrapper = document.createElement('div');
        wrapper.innerHTML = skin.trim();

        if (wrapper.firstChild.dataset.noWrapper) {
            wrapper = wrapper.firstChild;

            delete wrapper.dataset.noWrapper;
        }

        wrapper.classList.add('calamansi');
        wrapper.id = this.calamansi.id;

        // Replace the provided element with the compiled HTML
        this.el.parentNode.replaceChild(wrapper, this.el);
        this.el = wrapper;

        // Insert the element's content inside the skin's content slot
        const contentSlots = document.querySelectorAll(`#${this.el.id} .slot--content`);

        if (contentSlots && contentSlots.length > 0) {
            contentSlots.forEach(slot => {
                slot.innerHTML = content;
            });
        }
    }

    /**
     * Append a <link> with the skin's CSS to the page if this skin's CSS has
     * not been appended yet
     * 
     * @param {*} path 
     */
    loadCss(path) {
        const cssPath = `${path}/skin.css`;

        // If the skin's CSS has already been loaded
        if (document.querySelectorAll(`link[href="${cssPath}"]`).length > 0) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;

        document.querySelector('head').appendChild(link);
    }

    async fetchHtml(path) {
        return fetch(`${path}/skin.html`)
            .then(data => {
                if (data.status != 200) {
                    throw `Skin at path "${path}" not found!`;
                }

                return data.text();
            })
            .then(html => {
                html = html.trim();

                // Remove all the new lines
                while (html.search("\n") >= 0) {
                    html = html.replace(/\n/, '');
                }

                // Remove all the double spaces
                while (html.search('  ') >= 0) {
                    html = html.replace(/  /, '');
                }

                return html;
            });
    }

    activateControls() {
        this.el.addEventListener('click', (event) => {
            event.preventDefault();

            // Audio (playback) controls
            if (this.calamansi.audio) {
                if (event.target.classList.contains('control-play')) {
                    // "Play" button - start playback from 00:00
                    this.calamansi.audio.playFromStart();
                } else if (event.target.classList.contains('control-resume')) {
                    // "Play" button - start or resume playback
                    this.calamansi.audio.play();
                } else if (event.target.classList.contains('control-pause')) {
                    // "Pause" button
                    this.calamansi.audio.pause();
                } else if (event.target.classList.contains('control-stop')) {
                    // "Stop" button
                    this.calamansi.audio.stop();
                }
            }
        });
    }

    addEventListeners() {
        this.calamansi.on('loadedmetadata', (instance) => {
            this.updatePlaybackDuration(this.calamansi.audio.duration);
        });

        this.calamansi.on('timeupdate', (instance) => {
            this.updatePlaybackTime(this.calamansi.audio.currentTime);

            this.updatePlaybackTimeLeft(
                this.calamansi.audio.currentTime, this.calamansi.audio.duration
            );
        });
    }

    /**
     * Updating the UI
     */
    getEl(selector) {
        return document.querySelector(`#${this.el.id} ${selector}`);
    }

    updatePlaybackDuration(duration) {
        const el = this.getEl('.playback-duration');

        if (el) {
            el.innerText = this.formatTime(duration);
        }
    }

    updatePlaybackTime(currentTime) {
        const el = this.getEl('.playback-time');

        if (el) {
            el.innerText = this.formatTime(currentTime);
        }
    }

    updatePlaybackTimeLeft(time, duration) {
        const el = this.getEl('.playback-time-left');
        const timeLeft = duration - Math.floor(time);

        if (el) {
            el.innerText = '-' + this.formatTime(timeLeft);
        }
    }

    formatTime(seconds) {
        let minutes = seconds > 60
            ? Math.floor(seconds / 60)
            : '00';

        let hours = minutes > 60
            ? Math.floor(minutes / 60)
            : '00';

        seconds = Math.floor(seconds);

        if (seconds < 10) {
            seconds = `0${seconds}`;
        }

        if (minutes !== '00' && minutes < 10) {
            minutes = `0${minutes}`;
        }

        if (hours !== '00' && hours < 10) {
            hours = `0${hours}`;
        }

        return hours !== '00'
            ? `${hours}:${minutes}:${seconds}`
            : `${minutes}:${seconds}`;
    }
}

export default CalamansiSkin;