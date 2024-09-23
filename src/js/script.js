const api_endpoint = location.host ? 'https://api.lutopia.net' : 'http://localhost:8000';
async function api(path, init) {
  return (await fetch(`${api_endpoint}${path}`, init)).json();
}
function api_filepath(filename) {
  return `${api_endpoint}/tmp/${filename}`
}
async function download(url) {
  const response = await fetch(url)
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = url.split('/').pop();
  link.click();
}

window.addEventListener('load', async function() {
  const config_select_el = document.getElementById('configuration');
  const download_button_el = document.getElementById('download_button');
  const music_queue = [];

  // Setup audio element
  const audio_el = document.getElementsByTagName('audio')[0];
  audio_el.volume = 0.5; // Start at half volume because Robin is very loud
  let need_audio = true;
  const music_dequeue = async () => {
    if(music_queue.length > 0) {
      const new_music = music_queue.pop();
      audio_el.src = api_filepath(new_music.audio)
      audio_el.play();
      need_audio = false;
      const new_music_desc = await (await fetch(api_filepath(new_music.description))).json();
      const new_music_title = `${new_music_desc.scale} ${new_music_desc.tempo}bpm ${new_music_desc.signature.beats_per_bar}/${new_music_desc.signature.beat_value}`;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: new_music_title,
        artist: "Steve & Robin",
        album: config_select_el.value,
        artwork: [
          {
            src: location.origin+"/src/img/icon.png",
            sizes: "48x48",
            type: "image/png",
          },
        ],
      });
      this.document.title = new_music_title;
      download_button_el.addEventListener('click', async () => {
        await download(api_filepath(new_music.sequence));
      });
    } else {
      need_audio = true;
    }
  };
  audio_el.addEventListener('ended', music_dequeue);
  audio_el.addEventListener('error', () => {
    need_audio = true;
  });

  // Setup configuration menu
  const configs = await api('/steve/configurations');
  for(let config of configs) {
    const config_el = this.document.createElement('option');
    config_el.value = config;
    config_el.innerText = config; // TODO: make prettier
    config_select_el.appendChild(config_el);
  }
  config_select_el.value = 'sane'; // Decent default
  config_select_el.addEventListener('change', () => {
    music_queue.length = 0;
    need_audio = true;
  });

  // Setup queue mechanism
  const update_queue = async () => {
    if(music_queue.length == 0) {
      const steve_gen = await api(`/steve/generate?configuration=${config_select_el.value}`, {
        method: 'POST'
      });

      const robin_render = await api(`/robin/render?filename=${steve_gen.sequence}`, {
        method: 'POST'
      });

      music_queue.push({
        ...steve_gen,
        ...robin_render,
      });
    }
    if(music_queue.length > 0 && need_audio) {
      await music_dequeue();
    }
    setTimeout(update_queue, 1000);
  };

  navigator.mediaSession.setActionHandler('nexttrack', music_dequeue);

  // Setup buttons
  const skip_button_el = document.getElementById('skip_button');
  skip_button_el.addEventListener('click', music_dequeue);


  await update_queue();
});
