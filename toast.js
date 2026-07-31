 class Toast {
  constructor(pos = 'tc', maxStack = 3) {
    this.maxStack = maxStack;
    this.container = document.querySelector(`.toast-container[data-position="${pos}"]`);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.dataset.position = pos;
      document.body.appendChild(this.container);
    }
  }

  show(type, title, msg, duration = 3000) {
    const activeToasts = this.container.querySelectorAll('.toast');
    if (activeToasts.length >= this.maxStack) {
        activeToasts[0].remove();
    }

    const t = document.createElement('div');
    t.className = `toast style-solid toast-${type}`;
    t.innerHTML = `
      <div class="toast-icon">${this.getIcon(type)}</div>
      <div class="toast-content"><b>${title}</b><div>${msg}</div></div>
      <button class="toast-close">&times;</button>
      `;
	  
    const animMode = 'slide';
    const baseEntry = 'slideInDown';
    
    if (animMode === 'zoom') {
        t.style.animation = 'zoomIn 0.4s forwards';
    } else if (animMode === 'shake') {
        t.style.animation = `${baseEntry} 0.4s forwards, shake 0.4s 0.4s`;
    } else {
        t.style.animation = `${baseEntry} 0.4s forwards`;
    }	  
    
    this.container.appendChild(t);

    const currentPos = this.container.dataset.position;
    let animOut = currentPos.includes('r') ? 'slideOutRight' : 'slideOutLeft';
    if(currentPos === 'tc') animOut = 'slideOutUp';
    if(currentPos === 'bc') animOut = 'slideOutDown';

    

    const dismiss = () => {
        t.style.animation = `${animOut} 0.3s forwards`;
        t.addEventListener('animationend', () => t.remove());
    };

    t.querySelector('.toast-close').onclick = dismiss;
    setTimeout(dismiss, duration);
  }

  getIcon(type) {
    const icons = {"success":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6 9 17l-5-5\"/></svg>","error":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/></svg>","warning":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/></svg>","info":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4\"/><path d=\"M12 8h.01\"/></svg>"};
    return icons[type];
  }
}

window.Toast = Toast;
// USAGE
// const toast = new Toast();
// toast.show('success', 'Hello!', 'Mission complete.');
console.log("TOAST LOADED");