import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../styles/theme';

/**
 * PayHere WebView Component
 * Handles POST form submission to PayHere payment gateway
 */
const PayHereWebView = ({
  paymentUrl,
  paymentParams,
  onPaymentSuccess,
  onPaymentCancel,
  onClose
}) => {
  const webViewRef = useRef(null);

  // Generate HTML form that auto-submits to PayHere
  const generatePaymentForm = () => {
    const formFields = Object.keys(paymentParams)
      .map(key => `<input type="hidden" name="${key}" value="${paymentParams[key]}" />`)
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PayHere Payment</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .loading {
              text-align: center;
              color: #666;
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #667eea;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loading">
            <div class="spinner"></div>
            <p>Redirecting to PayHere...</p>
          </div>
          <form id="payhereForm" method="POST" action="${paymentUrl}">
            ${formFields}
          </form>
          <script>
            // Auto-submit form on load
            document.getElementById('payhereForm').submit();
          </script>
        </body>
      </html>
    `;
  };

  const handleNavigationStateChange = (navState) => {
    const { url, loading } = navState;


    // Check if this is a return URL (success or cancel)
    // PayHere redirects to our backend return URL after payment
    // IMPORTANT: Wait for the page to finish loading so the backend can process the payment
    if (url.includes('/payment/return') || url.includes('/payment/cancel')) {
      // Only process after the page has loaded (loading = false)
      // This ensures the backend /payment/return handler processes the request first
      if (!loading) {
        // Extract payment ID from URL
        try {
          const urlParts = url.split('?');
          if (urlParts.length > 1) {
            const params = new URLSearchParams(urlParts[1]);
            const paymentId = params.get('paymentId');

            // Add a small delay to ensure backend has processed the payment
            setTimeout(() => {
              if (url.includes('/payment/return')) {
                onPaymentSuccess?.(paymentId);
              } else if (url.includes('/payment/cancel')) {
                onPaymentCancel?.(paymentId);
              }
            }, 1000); // 1 second delay to ensure backend processing completes
          }
        } catch (error) {
          console.error('Error parsing return URL:', error);
        }
      }
    }

    // Also check if PayHere shows a success page (PayHere's own success page)
    // PayHere sandbox success page might contain specific text or URL patterns
    if (url.includes('payhere.lk') && (url.includes('success') || url.includes('complete'))) {
      // Wait a moment for the page to load, then check if it's a success page
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          (function() {
            const bodyText = document.body.innerText || document.body.textContent || '';
            if (bodyText.includes('success') || bodyText.includes('Success') || bodyText.includes('completed')) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'payment_success' }));
            }
          })();
        `);
      }, 2000);
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'payment_success') {
        // Extract payment ID from the current URL or use a callback
        onPaymentSuccess?.();
      } else if (data.type === 'payhere_error') {
        // Show PayHere-specific error
        const errorMsg = data.errorCode
          ? `PayHere Error Code: ${data.errorCode}\n\nThis usually means:\n• Return URLs are using localhost (use ngrok)\n• Merchant credentials mismatch\n• Hash calculation error`
          : `PayHere Error: ${data.errorText || 'Payment request was rejected'}`;

        Alert.alert(
          'Payment Request Failed',
          errorMsg,
          [
            {
              text: 'OK',
              onPress: () => onClose?.()
            }
          ]
        );
      }
    } catch (error) {
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;

    // Check if it's a PayHere error (500 status code)
    if (nativeEvent.statusCode === 500 && nativeEvent.url?.includes('payhere.lk')) {
      Alert.alert(
        'Payment Request Error',
        'PayHere rejected the payment request. This usually means:\n\n' +
        '1. Return URLs are using localhost (PayHere sandbox requires public URLs)\n' +
        '2. Merchant credentials are incorrect\n' +
        '3. Hash calculation mismatch\n\n' +
        'Please check your backend configuration and use ngrok for localhost URLs.',
        [
          {
            text: 'OK',
            onPress: () => onClose?.()
          }
        ]
      );
    } else {
      Alert.alert(
        'Payment Error',
        'Failed to load payment page. Please check your internet connection and try again.',
        [
          {
            text: 'OK',
            onPress: () => onClose?.()
          }
        ]
      );
    }
  };

  const handleHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;

    // PayHere returns 500 for invalid payment requests
    if (nativeEvent.statusCode === 500) {
      // Try to extract error message from the page
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          (function() {
            const bodyText = document.body.innerText || document.body.textContent || '';
            const errorMatch = bodyText.match(/Error code: (\\d+)/);
            if (errorMatch) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'payhere_error', 
                errorCode: errorMatch[1],
                errorText: bodyText.substring(0, 200)
              }));
            } else if (bodyText.includes('Unauthorized') || bodyText.includes('Something went wrong')) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'payhere_error', 
                errorText: bodyText.substring(0, 200)
              }));
            }
          })();
        `);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generatePaymentForm() }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleHttpError}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default PayHereWebView;

