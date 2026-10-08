// ============================================================
// NAGAR CONNECT - APP BOOTSTRAPPER
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🏛️ NAGAR CONNECT: Bootstrapping municipal e-governance frontend...');

  // Initialize Theme from localStorage or system preference
  const savedTheme = localStorage.getItem('nagar_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Initialize RAG Assistant Panel (Member 5 Integration Contract)
  window.renderRAGChatPanel();

  // Initialize SPA Router
  window.router.init();

  console.log('✅ Nagar Connect platform initialized successfully.');
});
