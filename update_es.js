const fs = require('fs');
const esPath = 'messages/es.json';
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

es.AdminSEO.gsc_label = 'Google Search Console';
es.AdminSEO.gsc_help = 'Clave de verificación (ej: xxxxxxx-yyyyyy). Obténgala al añadir la propiedad "Prefijo de URL" (método de etiqueta HTML).';
es.AdminSEO.gsc_placeholder = 'tu_codigo_de_verificacion';
es.AdminSEO.ga_label = 'Google Analytics (G-XXXXX)';
es.AdminSEO.ga_help = 'ID de medición para su propiedad de Google Analytics 4. El script se activará automáticamente cuando el usuario acepte las cookies estadísticas.';
es.AdminSEO.ga_placeholder = 'G-XXXXXXXXXX';
es.AdminSEO.local_seo_title = 'SEO Local y Datos Estructurados';
es.AdminSEO.store_country_label = 'País de la Tienda (Código ISO)';
es.AdminSEO.store_country_help = 'Ej: US, GB, DE, FR. Usado para indicar la ubicación principal a Google.';
es.AdminSEO.rss_protection_title = 'Feed RSS y Protección de Contenido';
es.AdminSEO.rss_protection_desc = 'Añada contenido personalizado antes o después de cada artículo en su feed RSS. Use las variables <code>{post_link}</code>, <code>{blog_link}</code>, <code>{author}</code> y <code>{featuredimage}</code>.';
es.AdminSEO.rss_before_label = 'Contenido antes del artículo (RSS)';
es.AdminSEO.rss_before_placeholder = 'Ej: Bienvenido a nuestro blog...';
es.AdminSEO.rss_after_label = 'Contenido después del artículo (RSS)';
es.AdminSEO.rss_after_help = 'Recomendado para atribución SEO (estilo RankMath).';
es.AdminSEO.rss_after_placeholder = 'El artículo {post_link} apareció por primera vez en {blog_link}.';

fs.writeFileSync(esPath, JSON.stringify(es, null, 2), 'utf8');
console.log('es.json updated successfully!');
