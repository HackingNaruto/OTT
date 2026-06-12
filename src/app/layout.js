import { supabase } from '../lib/supabase';

export const revalidate = 0; // Ensure dynamic metadata is always fresh
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const { data } = await supabase.from('site_settings').select('site_name').eq('id', 1).single();
  const siteName = data?.site_name || 'Premium OTT';
  return {
    title: `${siteName} - Premium Streaming`,
    description: 'Premium Secure Streaming App',
    manifest: '/manifest.json',
    themeColor: '#e50914'
  };
}

import PwaRegister from '../components/PwaRegister';
import AntiPiracy from '../components/AntiPiracy';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS CDN for instant styling */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = { darkMode: 'class' };
        `}}></script>
        <script dangerouslySetInnerHTML={{__html: `
          if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        `}}></script>
        {/* FontAwesome for Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style dangerouslySetInnerHTML={{__html: `
          body {
            -webkit-touch-callout: none; /* Disable iOS hold popup */
            -webkit-user-select: none;   /* Safari */
            -khtml-user-select: none;    /* Konqueror HTML */
            -moz-user-select: none;      /* Old versions of Firefox */
            -ms-user-select: none;       /* Internet Explorer/Edge */
            user-select: none;           /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
          }
          img {
            -webkit-user-drag: none;
            -khtml-user-drag: none;
            -moz-user-drag: none;
            -o-user-drag: none;
            user-drag: none;
          }
        `}}></style>
      </head>
      <body className="bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white min-h-screen transition-colors select-none">
        <AntiPiracy />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
