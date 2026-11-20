
import "./globals.css";

export const metadata = { title: "Acceso al Sistema - UVG" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Montserrat:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
  rel="stylesheet"
/>
      </head>
      <body>{children}</body>
    </html>
  );
}