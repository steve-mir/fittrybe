export default function SessionPage({ params }: { params: { id: string } }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Opening FitTrybe...</title>
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          window.location.href = "fittrybe://session/${params.id}";
          setTimeout(function() {
            window.location.href = "https://fittrybe.app/session/${params.id}";
          }, 1500);
        `}} />
        <p>Opening FitTrybe...</p>
      </body>
    </html>
  )
}
