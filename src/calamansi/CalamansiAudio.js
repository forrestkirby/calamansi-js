class CalamansiAudio
{
    constructor(calamansi, source) {
        this.calamansi = calamansi;
        this.audio = new Audio(source);

        // Metadata
        this.duration = 0;
        
        // State
        this.loadedPercent = 0.0;
        this.currentTime = 0;
        this.volume = this.audio.volume;
        
        this.addEventListeners();
    }

    addEventListeners() {
        this.audio.addEventListener('loadedmetadata', (event) => {
            this.duration = this.audio.duration;

            this.calamansi.emit('loadedmetadata', this.calamansi);
            CalamansiEvents.emit('loadedmetadata', this.calamansi);
        });

        // Fired when the first frame of the media has finished loading.
        this.audio.addEventListener('loadeddata', (event) => {
            this._setCurrentTime(this.audio.currentTime);

            this.calamansi.emit('loadeddata', this.calamansi);
            CalamansiEvents.emit('loadeddata', this.calamansi);
        });

        // Data has been fully loaded till the end
        this.audio.addEventListener('canplaythrough', (event) => {
            this.loadedPercent = 100;

            this.calamansi.emit('canplaythrough', this.calamansi);
            CalamansiEvents.emit('canplaythrough', this.calamansi);

            this.calamansi.emit('loadingProgress', this.calamansi);
            CalamansiEvents.emit('loadingProgress', this.calamansi);
        });

        this.audio.addEventListener('timeupdate', (event) => {
            this._setCurrentTime(this.audio.currentTime);
        });

        this.audio.addEventListener('ended', (event) => {
            this._setCurrentTime(0);

            this.calamansi.emit('ended', this.calamansi);
            CalamansiEvents.emit('ended', this.calamansi);
        });
    }

    playFromStart() {
        this.audio.load();
        this.audio.play();

        this.calamansi.emit('play', this.calamansi);
        CalamansiEvents.emit('play', this.calamansi);
    }

    play() {
        this.audio.play();

        this.calamansi.emit('play', this.calamansi);
        CalamansiEvents.emit('play', this.calamansi);
    }

    pause() {
        this.audio.pause();

        this.calamansi.emit('pause', this.calamansi);
        CalamansiEvents.emit('pause', this.calamansi);
    }

    stop() {
        this.audio.pause();
        this.audio.load();

        this.calamansi.emit('stop', this.calamansi);
        CalamansiEvents.emit('stop', this.calamansi);
    }

    _setCurrentTime(time) {
        this.currentTime = time;

        this.calamansi.emit('timeupdate', this.calamansi);
        CalamansiEvents.emit('timeupdate', this.calamansi);
    }

    seekTo(time) {
        this.audio.currentTime = time;

        this._setCurrentTime(time);
    }

    _setVolume(volume) {
        this.volume = volume;

        this.calamansi.emit('volumechange', this.calamansi);
        CalamansiEvents.emit('volumechange', this.calamansi);
    }

    changeVolume(volume) {
        this.audio.volume = volume;

        this._setVolume(volume);
    }
}

export default CalamansiAudio;