const api_endpoint = location.host ? 'https://api.lutopia.net' : 'http://localhost:8000';
async function api(path, init) {
  return (await fetch(`${api_endpoint}${path}`, init)).json();
}
function api_filepath(filename) {
  return `${api_endpoint}/tmp/${filename}`
}

window.addEventListener('load', async function() {
  const music_queue = [];
  const config_select_el = document.getElementById('configuration');

  const audio_el = this.document.getElementsByTagName('audio')[0];
  let need_audio = true;
  const music_dequeue = () => {
    if(music_queue.length > 0) {
      audio_el.src = music_queue.pop();
      audio_el.play();
      need_audio = false;
    } else {
      need_audio = true;
    }
  };
  audio_el.addEventListener('ended', () => {
    need_audio = true;
    music_dequeue();
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
  const time_to_preload = 10;
  const update_queue = async () => {
    if(music_queue.length == 0 && (need_audio || audio_el.duration - audio_el.currentTime < time_to_preload)) {
      const steve_gen = await api(`/steve/generate?configuration=${config_select_el.value}`, {
        method: 'POST'
      });

      const robin_render = await api(`/robin/render?filename=${steve_gen.sequence}`, {
        method: 'POST'
      });

      music_queue.push(api_filepath(robin_render.audio));
    }
    if(music_queue.length > 0 && need_audio) {
      music_dequeue();
    }
    setTimeout(update_queue, 1000);
  };

  await update_queue();
});
