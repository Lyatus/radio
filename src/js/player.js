class Player {
  constructor() {
    this.audio = document.getElementsByTagName('audio')[0];
    this.audio.volume = 0.5;
    this.audio.addEventListener('ended', () => this.dequeue());
    this.audio.addEventListener('error', () => {
      this.need_audio = true;
    });
    this.queue = [];
    this.need_audio = true;
    this.config = 'sane';

    navigator.mediaSession.setActionHandler('nexttrack', () => this.dequeue());

    this.sheet = new Sheet();
    //this.audio.addEventListener('timeupdate', () => this.sheet.set_time(this.audio.currentTime));  // This is too irregular
    setInterval(() => this.sheet.set_time(this.audio.currentTime), 30);
  }

  set_config(config) {
    this.config = config;
    this.queue = [];
    this.need_audio = true;
  }

  async update_queue() {
    if(this.queue.length == 0) {
      const steve_gen = await api(`/steve/generate?configuration=${this.config}`, {
        method: 'POST'
      });

      const robin_render = await api(`/robin/render?filename=${steve_gen.sequence}`, {
        method: 'POST'
      });

      const new_music = {
        config: this.config,
        ...steve_gen,
        ...robin_render,
      };

      new_music.description = await (await fetch(api_filepath(new_music.description))).json();

      this.queue.push(new_music);
    }
    if(this.queue.length > 0 && this.need_audio) {
      await this.dequeue();
    }
    setTimeout(() => this.update_queue(), 1000);
  };

  dequeue() {
    if(this.queue.length > 0) {
      this.current_music = this.queue.pop();
      this.audio.src = api_filepath(this.current_music.audio)
      this.audio.play();
      this.need_audio = false;
      const new_music_desc = this.current_music.description;
      const new_music_title = `${new_music_desc.scale.name} ${new_music_desc.tempo}bpm ${new_music_desc.signature.beats_per_bar}/${new_music_desc.signature.beat_value}`;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: new_music_title,
        artist: "Steve & Robin",
        album: this.config,
        artwork: [
          {
            src: location.origin+"/src/img/icon.png",
            sizes: "48x48",
            type: "image/png",
          },
        ],
      });
      document.title = new_music_title;
      this.sheet.set_music(new_music_desc);
    } else {
      this.need_audio = true;
    }
  }
}
