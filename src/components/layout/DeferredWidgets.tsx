'use client';  
  
import { useEffect } from 'react';
import dynamic from 'next/dynamic';  
  
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false });  
const BackToTop = dynamic(() => import('@/components/BackToTop'), { ssr: false });  
  
export default function DeferredWidgets({  
  chatEnabled,  
  chatStoreName,  
  chatStoreIcon,  
}: {  
  chatEnabled: boolean;  
  chatStoreName: string;  
  chatStoreIcon: string;  
}) {  
  useEffect(() => {
    const hideNetlify = () => {
      const selectors = [
        'iframe[src*="netlify"]',
        'iframe[id*="netlify"]',
        'iframe[title*="Netlify" i]',
        'div[id*="netlify"]',
        'div[class*="netlify-badge"]',
        '#netlify-badge',
        '.netlify-badge',
        '#netlify-drawer',
        '[data-netlify-deploy-id]',
      ];

      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.setProperty('display', 'none', 'important');
          (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
          (el as HTMLElement).style.setProperty('opacity', '0', 'important');
          (el as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
          el.remove();
        });
      });

      // Target any root-level injected elements containing "Powered by Netlify"
      document.querySelectorAll('body > div, body > iframe').forEach((el) => {
        const text = el.textContent || '';
        if (text.includes('Powered by Netlify') || text.includes('netlify')) {
          (el as HTMLElement).style.setProperty('display', 'none', 'important');
          el.remove();
        }
      });
    };

    hideNetlify();

    const observer = new MutationObserver(() => {
      hideNetlify();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (  
    <>  
      <ChatWidget  
        enabled={chatEnabled}  
        storeName={chatStoreName}  
        storeIcon={chatStoreIcon}  
      />  
      <BackToTop />  
    </>  
  );  
} 
