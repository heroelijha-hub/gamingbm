'use client';

import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { basicSanitizeHtml } from '@/lib/security';

/**
 * Renders sanitized HTML content safely using DOMPurify.
 * Use this component instead of dangerouslySetInnerHTML for any 
 * user-generated or admin-provided HTML content.
 * 
 * Style tags and internal CSS are NOT sanitized by this component
 * since they don't come from user input.
 */
export default function SafeHTML({ 
  html, 
  className,
  as: Tag = 'div',
  style,
}: { 
  html: string; 
  className?: string;
  as?: 'div' | 'span' | 'h2' | 'p' | 'section' | 'article';
  style?: React.CSSProperties;
}) {
  const [clean, setClean] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (html) {
      const htmlToRender = html.replace(/&nbsp;/g, ' ');

      // Restrict iframes to trusted domains only
      DOMPurify.addHook('uponSanitizeElement', (node, data) => {
        if (data.tagName === 'iframe') {
          const el = node as Element;
          const src = el.getAttribute ? el.getAttribute('src') || '' : '';
          const isAllowed = /^(https?:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|google\.com\/maps|maps\.google\.com)\//i.test(src);
          if (!isAllowed) {
            el.parentNode?.removeChild(el);
          }
        }
      });

      setClean(DOMPurify.sanitize(htmlToRender, {
        // Allow common HTML tags for rich content
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'ul', 'ol', 'li',
          'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'mark',
          'a', 'img', 'figure', 'figcaption',
          'blockquote', 'pre', 'code',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span', 'section', 'article',
          'video', 'source', 'iframe',
          'sup', 'sub', 'small',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'title', 'alt',
          'src', 'width', 'height', 'loading',
          'class', 'id', 'style',
          'colspan', 'rowspan',
          'controls', 'autoplay', 'muted', 'loop', 'type',
          'allowfullscreen', 'frameborder',
        ],
        // Allow safe URI schemes only
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        // Remove any script-related content
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
      }));
    }
  }, [html]);

  // Render basicSanitizeHtml during SSR for SEO and safety, then swap to DOMPurify on client
  // We also replace &nbsp; with regular spaces because copied text often has excessive &nbsp; which prevents word wrapping
  const htmlToRender = (html || '').replace(/&nbsp;/g, ' ');
  const renderHtml = isClient ? clean : basicSanitizeHtml(htmlToRender);
  
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: renderHtml }} />;
}
