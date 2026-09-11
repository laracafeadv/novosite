// Faz a prévia do editor de artigo (dentro do /admin) usar a fonte Poppins
// nos títulos, igual às páginas de artigo publicadas no site.
if (window.CMS && typeof window.CMS.registerPreviewStyle === 'function') {
  window.CMS.registerPreviewStyle('/admin/preview-poppins.css');
}
