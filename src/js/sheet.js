const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

class Sheet {
  constructor() {
    this.section_el = document.getElementById('sheet');
    this.scale_el = document.createElement('span');
    this.section_el.appendChild(this.scale_el);
    this.duration_el = document.createElement('span');
    this.section_el.appendChild(this.duration_el);
    this.tempo_el = document.createElement('span');
    this.section_el.appendChild(this.tempo_el);
    this.signature_el = document.createElement('span');
    this.section_el.appendChild(this.signature_el);

    this.section_el.style.display = 'none';
  }

  set_music(desc) {
    this.scale_el.innerText = `Scale: ${notes[desc.scale.key]} ${desc.scale.name}`;
    const duration = Math.floor(desc.duration);
    this.duration_el.innerText = `Duration: ${Math.floor(duration/60)}:${duration%60}`;
    this.tempo_el.innerText = `BPM: ${desc.tempo}`;
    this.signature_el.innerText = `Signature: ${desc.signature.beats_per_bar}/${desc.signature.beat_value}`;
    this.section_el.style.display = 'block';
  }
}
