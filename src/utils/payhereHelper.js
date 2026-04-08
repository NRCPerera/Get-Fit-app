/**
 * PayHere Payment Helper
 * Generates HTML form for POST submission to PayHere
 */

export const generatePayHereForm = (paymentUrl, paymentParams) => {
  const formFields = Object.keys(paymentParams)
    .map(key => {
      const value = paymentParams[key];
      return `<input type="hidden" name="${key}" value="${value}" />`;
    })
    .join('\n    ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta charset="UTF-8">
  <title>PayHere Payment</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .text {
      color: #333;
      font-size: 16px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p class="text">Redirecting to PayHere...</p>
  </div>
  <form id="payhereForm" method="POST" action="${paymentUrl}">
    ${formFields}
  </form>
  <script>
    // Auto-submit form immediately
    (function() {
      document.getElementById('payhereForm').submit();
    })();
  </script>
</body>
</html>
  `.trim();
};

/**
 * Create a data URI from HTML for opening in browser
 */
export const createPayHereDataURI = (paymentUrl, paymentParams) => {
  const html = generatePayHereForm(paymentUrl, paymentParams);
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
};

