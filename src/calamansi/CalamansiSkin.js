class CalamansiSkin
{
    constructor(calamansi, path) {
        this.calamansi = calamansi;
        this.path = path;

        this.el = calamansi.el;

        // State
        this.mouseDownTarget = null;
    }

    async init() {
        // Load and apply the skin
        const content = await this.load();

        // Set UI elements
        this.setUiElements(content);

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

        return content;
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

    setUiElements(content) {
        // Insert the element's content inside the skin's content slot
        const contentSlots = document.querySelectorAll(`#${this.el.id} .slot--content`);

        if (contentSlots && contentSlots.length > 0) {
            contentSlots.forEach(slot => {
                slot.innerHTML = content;
            });
        }

        // Set up the playlist
        this.updatePlaylist();

        // Set the track info fields
        this.updateTrackInfo();
    }

    activateControls() {
        this.el.addEventListener('mousedown', (event) => {
            this.mouseDownTarget = event.target;
        });

        document.addEventListener('mouseup', (event) => {
            this.mouseDownTarget = null;
        });

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
                } else if (event.target.classList.contains('playback-load') || event.target.classList.contains('playback-progress')) {
                    const position = event.layerX / event.target.parentNode.offsetWidth;

                    this.calamansi.audio.seekTo(position * this.calamansi.audio.duration);
                } else if (event.target.classList.contains('volume-bar') || event.target.classList.contains('volume-value')) {
                    const parent = event.target.classList.contains('volume-bar')
                        ? event.target
                        : event.target.parentNode;

                    const position = event.layerX / parent.offsetWidth;

                    this.calamansi.audio.changeVolume(position);
                }
            }
        });

        document.addEventListener('mousemove', (event) => {
            // Audio (playback) controls
            if (this.calamansi.audio && this.mouseDownTarget) {
                if (this.mouseDownTarget.classList.contains('playback-load') || this.mouseDownTarget.classList.contains('playback-progress')) {
                    // Smooth seeking
                    const parent = this.mouseDownTarget.parentNode;

                    const position = (event.clientX - parent.offsetLeft) / parent.offsetWidth;

                    this.calamansi.audio.seekTo(position * this.calamansi.audio.duration);
                } else if (this.mouseDownTarget.classList.contains('volume-bar') || this.mouseDownTarget.classList.contains('volume-value')) {
                    // Smooth change of the volume
                    const parent = this.mouseDownTarget.classList.contains('volume-bar')
                        ? this.mouseDownTarget
                        : this.mouseDownTarget.parentNode;

                    // const position = event.layerX / parent.offsetWidth;
                    const position = (event.clientX - parent.offsetLeft) / parent.offsetWidth;

                    this.calamansi.audio.changeVolume(position);
                }
            }
        });
    }

    addEventListeners() {
        this.calamansi.on('loadedmetadata', (instance) => {
            this.updatePlaybackDuration(instance.audio.duration);
        });

        this.calamansi.on('timeupdate', (instance) => {
            this.updatePlaybackTime(instance.audio.currentTime);

            this.updatePlaybackTimeLeft(
                instance.audio.currentTime, instance.audio.duration
            );

            this.updatePlaybackProgress(
                instance.audio.currentTime, instance.audio.duration
            );
        });

        this.calamansi.on('loadingProgress', (instance) => {
            this.updateLoadingProgress(instance.audio.loadedPercent);
        });

        this.calamansi.on('volumechange', (instance) => {
            this.updateVolume(instance.audio.volume);
        });

        this.calamansi.on('trackInfoReady', (instance, track) => {
            if (instance.currentTrack().source === track.source) {
                this.updateTrackInfo();
            }

            this.updatePlaylist();
        });

        this.calamansi.on('playlistLoaded', (instance) => {
            this.updatePlaylist();
        });

        this.calamansi.on('trackSwitched', (instance) => {
            this.updateTrackInfo();
        });
    }

    /**
     * Updating the UI
     */
    getEl(selector) {
        return document.querySelector(`#${this.el.id} ${selector}`);
    }

    findEl(item, selector) {
        return item.querySelector(selector);
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

        if (el) {
            const timeLeft = duration - Math.floor(time);

            el.innerText = '-' + this.formatTime(timeLeft);
        }
    }

    updatePlaybackProgress(time, duration) {
        const el = this.getEl('.playback-progress');

        if (el) {
            const progress = (time / duration) * 100;

            el.style.width = progress + '%';
        }
    }

    updateLoadingProgress(progress) {
        const el = this.getEl('.playback-load');

        if (el) {
            el.style.width = progress + '%';
        }
    }

    updateVolume(volume) {
        const el = this.getEl('.volume-value');

        if (el) {
            el.style.width = (volume * 100) + '%';
        }
    }

    formatTime(seconds) {
        let hours = seconds > 1 ? Math.floor(seconds / 60 / 60) : 0;
        let minutes = seconds > 1 ? Math.floor(seconds / 60) : 0;

        if (minutes >= 60) {
            minutes -= hours * 60;
        }

        seconds = Math.floor(seconds);

        if (seconds >= 60) {
            seconds -= minutes * 60;
        }

        // Add trailing zeros if required
        if (seconds < 10) {
            seconds = `0${seconds}`;
        }

        if (minutes < 10) {
            minutes = `0${minutes}`;
        }

        if (hours < 10) {
            hours = `0${hours}`;
        }

        return hours != 0
            ? `${hours}:${minutes}:${seconds}`
            : `${minutes}:${seconds}`;
    }

    updatePlaylist() {
        if (!this.calamansi.currentPlaylist()) {
            return;
        }
        
        const el = this.getEl('.playlist');

        if (!el) {
            return;
        }

        if (el.nodeName.toLowerCase() === 'table') {
            // TODO: Method to be implemented
            this.updatePlaylistTable(el);
        } else {
            this.updatePlaylistUl(el);
        }
    }

    updatePlaylistUl(container) {
        // Remove the current list
        if (container.querySelector('ul')) {
            container.removeChild(container.querySelector('ul'))
        }

        const ul = document.createElement('ul');

        let template = this.getEl('.playlist-item.template');
        
        if (template) {
            template = template.cloneNode(true);
            template.classList.remove('template');
        }

        for (let track of this.calamansi.currentPlaylist().list) {
            let li = document.createElement('li');

            if (template) {
                const item = template.cloneNode(true);

                for (let key in track.info) {
                    let el = this.findEl(item, `.playlist-item--${key}`);

                    if (el) {

                        switch (key) {
                            case 'albumCover':
                                // TODO: Display album cover
                                break
                            case 'duration':
                                el.innerText = this.formatTime(track.info[key]);
                                break;
                            default:
                                el.innerText = track.info[key];
                        }
                    }
                }

                if (track === this.calamansi.currentTrack()) {
                    item.classList.add('active');
                }
                
                li.appendChild(item);
            } else {
                li.innerText = track.info.name;
            }

            ul.appendChild(li);
        }

        container.appendChild(ul);
    }

    updateTrackInfo() {
        if (!this.calamansi.currentTrack() || !this.calamansi.currentTrack().info) {
            return;
        }

        const info = this.calamansi.currentTrack().info;

        for (let key in info) {
            let el = this.getEl(`.track-info--${key}`);

            if (el) {
                if (key === 'albumCover') {
                    // TODO: Display album cover
                    let base64 = info[key].data;

                    base64 = 'data:image/png;charset=utf-8;base64,'
                        + btoa(unescape(encodeURIComponent(base64)));

                    // console.log(base64);

                    el.src = base64;

                    continue;
                }

                el.innerText = info[key];
            }
        }
    }
}

export default CalamansiSkin;