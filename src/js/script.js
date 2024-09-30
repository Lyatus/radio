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
  const player = new Player();

  // Setup configuration menu
  const config_select_el = document.getElementById('configuration');
  const configs = await api('/steve/configurations');
  for(let config of configs) {
    const config_el = this.document.createElement('option');
    config_el.value = config;
    config_el.innerText = config; // TODO: make prettier
    config_select_el.appendChild(config_el);
  }
  config_select_el.value = player.config;
  config_select_el.addEventListener('change', e => {
    player.set_config(e.target.value);
  });


  // Setup buttons
  const skip_button_el = document.getElementById('skip_button');
  skip_button_el.addEventListener('click', () => player.dequeue());
  const download_button_el = document.getElementById('download_button');
  download_button_el.addEventListener('click', async () => {
    await download(api_filepath(player.current_music.sequence));
  });

  await player.update_queue();
});
