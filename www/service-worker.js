const CACHE_NAME = 'estudo-bunga-tech-jogo-v1';
const urlsToCache = [
  '/', // Cacha o escopo raiz (necessário para PWAs)
  'index.html', // Caminho relativo para o arquivo principal
  'style.css',
  'script.js',
  'manifest.json',
  
  // 🔑 Arquivos de Dados e Mídia (Caminhos relativos)
  'perguntas.json',
  'background_music.mp3',
  
  // 🔑 Arquivos de Imagem (Verifique o nome "sonligado.png" vs "son.png")
  'play.png',
  'setting.png',
  'admin.png',
  'voltar.png',
  'dashboard.png',
  'avancar.png',
  'repetir.png',
  'lixo.png',
  'sonligado.png',    // 💡 Corrigido para ser consistente (Se o arquivo for 'son.png', mude aqui)
  'sondesligado.png',
  'logo-192.png',
  'logo-512.png',
  'admin-foto.jpg' 
];

self.addEventListener('install', event => {
  // Executa durante a instalação do Service Worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // O método .addAll irá falhar se UM ÚNICO arquivo não for encontrado.
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
          console.error('Falha ao adicionar arquivos ao cache:', err);
          // O Service Worker não será instalado se houver um erro, o que é o comportamento esperado.
      })
  );
});

self.addEventListener('fetch', event => {
  // Intercepta todas as requisições
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o arquivo do cache se for encontrado
        if (response) {
          return response;
        }
        // Caso contrário, busca na rede (se estiver online)
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  // Remove caches antigos
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});