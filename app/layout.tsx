import '@/app/ui/global.css';
<<<<<<< HEAD

=======
import { inter } from '@/app/ui/fonts';
>>>>>>> bfa127832abd8350f601b78f4316352811342c74
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
<<<<<<< HEAD
      
=======
      <body className={`${inter.className}`} >{children}</body>
>>>>>>> bfa127832abd8350f601b78f4316352811342c74
    </html>
  );
}
