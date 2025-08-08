
(function(){
  if (!window.crypto) window.crypto = {};
  if (typeof window.crypto.randomUUID !== 'function') {
    window.crypto.randomUUID = function() {
      const bytes = window.crypto.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(16)) : Array.from({length:16},()=>Math.floor(Math.random()*256));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const toHex = b => ('0' + b.toString(16)).slice(-2);
      const b = Array.from(bytes, toHex);
      return `${b[0]}${b[1]}${b[2]}${b[3]}-${b[4]}${b[5]}-${b[6]}${b[7]}-${b[8]}${b[9]}-${b[10]}${b[11]}-${b[12]}${b[13]}${b[14]}${b[15]}`;
    };
  }
  window.addEventListener('error', function(e){
    var el = document.getElementById('err-banner');
    if(!el){
      el = document.createElement('div');
      el.id = 'err-banner';
      el.style.position='fixed'; el.style.bottom='8px'; el.style.left='8px'; el.style.right='8px';
      el.style.background='rgba(255, 71, 87, .95)'; el.style.color='#fff'; el.style.padding='8px 12px';
      el.style.borderRadius='10px'; el.style.fontFamily='system-ui'; el.style.zIndex='99999'; el.style.fontSize='12px';
      document.body.appendChild(el);
    }
    el.textContent = 'Hata: ' + (e.message || 'Bilinmeyen hata');
  });
})();