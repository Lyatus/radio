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
  const music_queue = [];

  // Setup audio element
  const audio_el = document.getElementsByTagName('audio')[0];
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
    music_dequeue();
  });
  audio_el.addEventListener('error', () => {
    need_audio = true;
  });

  // Setup configuration menu
  const config_select_el = document.getElementById('configuration');
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

      music_queue.push(api_filepath(robin_render.audio));
    }
    if(music_queue.length > 0 && need_audio) {
      music_dequeue();
    }
    setTimeout(update_queue, 1000);
  };

  // Setup buttons
  const skip_button_el = document.getElementById('skip_button');
  skip_button_el.addEventListener('click', () => {
    music_dequeue();
  });
  const download_button_el = document.getElementById('download_button');
  download_button_el.addEventListener('click', async () => {
    await download(audio_el.src);
  });

  await update_queue();
});
