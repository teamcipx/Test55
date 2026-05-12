import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router';

export default function AdPopunder() {
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
    if (!shouldShow) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://pl29422380.profitablecpmratenetwork.com/e0/e6/b3/e0e6b3507f0dba114bcbcbd4bbd8ce65.js';
    
    document.head.appendChild(script);

    return () => {
       if (document.head.contains(script)) {
         document.head.removeChild(script);
       }
    };
  }, [shouldShow]);

  return null;
}
