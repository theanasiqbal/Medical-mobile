export async function sendPushNotification(expoPushToken: string, title: string, body: string, data: Record<string, unknown> = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      console.error(`[Push] Failed to send notification to ${expoPushToken}`, await response.text());
      return false;
    }
    
    const result = await response.json();
    console.log(`[Push] Notification sent to ${expoPushToken}`, result);
    return true;
  } catch (error) {
    console.error(`[Push] Error catching send push notification:`, error);
    return false;
  }
}
