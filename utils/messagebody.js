const html = (message) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Signup Success</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .container {
        text-align: center;
      }
    </style>
    </head>
    <body>
        <div class="container">
        <h2>${message}</h2>
    </div>
    </body>
    </html>
    `;
};

export default html;