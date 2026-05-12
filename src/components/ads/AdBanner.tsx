import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router';

export default function AdBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check path
    const noAdPaths = ['/', '/login', '/signup', '/premium', '/premium-content'];
    if (noAdPaths.includes(location.pathname)) {
      setShouldShow(false);
      return;
    }

    const checkPremium = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShouldShow(true);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single();
      if (profile?.is_premium) {
        setShouldShow(false);
      } else {
        setShouldShow(true);
      }
    };
    checkPremium();
  }, [location.pathname]);

  useEffect(() => {
    if (!shouldShow || !bannerRef.current) return;
    
    // Some ad scripts use document.write which doesn't work asynchronously.
    // Creating an iframe is a safer way to render these ad tags.
    const iframe = document.createElement('iframe');
    iframe.width = '468';
    iframe.height = '60';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    
    bannerRef.current.innerHTML = '';
    bannerRef.current.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }</style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : 'efba3946ecee6b97d53746ef5bf0da32',
              'format' : 'iframe',
              'height' : 60,
              'width' : 468,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/efba3946ecee6b97d53746ef5bf0da32/invoke.js"></script>
        </body>
        </html>
      `);
      iframeDoc.close();
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <div className="flex justify-center my-4 overflow-hidden w-full max-w-[468px] h-[60px] mx-auto bg-zinc-900/50 rounded flex-shrink-0" ref={bannerRef}>
    </div>
  );
}
