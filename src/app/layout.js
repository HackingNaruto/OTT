import { supabase } from '../lib/supabase';

export const revalidate = 0; // Ensure dynamic metadata is always fresh

export async function generateMetadata() {
  const { data } = await supabase.from('site_settings').select('site_name').eq('id', 1).single();
  const siteName = data?.site_name || 'StreamX';
  return {
    title: `${siteName} - Premium Streaming`,
    description: 'Premium Secure Streaming App',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS CDN for instant styling */}
        <script src="https://cdn.tailwindcss.com"></script>
        {/* FontAwesome for Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="bg-zinc-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
