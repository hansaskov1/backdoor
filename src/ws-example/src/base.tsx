export const BaseHtml = ({ children }: { children: undefined | {} }) => (
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Smart lock</title>
            <script src="https://unpkg.com/htmx.org@1.9.6"></script>
            <script src="https://unpkg.com/htmx.org@1.9.11/dist/ext/ws.js"></script>
            <script></script>
        </head>

        <body>
            <main>
                {children}
            </main>
        </body>

    </html>
);